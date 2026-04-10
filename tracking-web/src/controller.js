import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  query,
  Timestamp,
  where,
} from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js';
import { log, logErr }                from './config.js';
import { isHeadingToPickup, isArrivedOrBeyond, isLiveTrackingStatus } from './status.js';
import { showPanel, setHeading, applyArrivedUI, setupStaticUI, startCountdown, parsePickupDate } from './ui.js';
import { initMap, updateDriverMarker }                                                from './map.js';

const POLL_MS = 5 * 60 * 1000;
const EARLY_WINDOW_MS = 60 * 60 * 1000;

export function createTrackingController(db, { linkSignature }) {
  let unsubscribe    = null;
  let pollTimer      = null;
  let initialised    = false;
  let countdownTimer = null;
  let readCount      = 0;

  const q = query(
    collection(db, 'tasks'),
    where('link_signature', '==', linkSignature),
    where('tracking_link_expires_at', '>', Timestamp.now()),
    limit(1),
  );

  function clearPoll() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  }

  function detach(reason) {
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }
    clearPoll();
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
    log(`🔌 Detached | reason: ${reason} | reads: ${readCount}`);
  }

  function handleExpired() { detach('expired'); showPanel('expired'); }
  function handleArrived() { detach('arrived'); applyArrivedUI(); }

  function applyPickupHeading(d, status) {
    const dLat = isLiveTrackingStatus(status) ? parseFloat(d.last_latitude ?? d.latitude)  : NaN;
    const dLng = isLiveTrackingStatus(status) ? parseFloat(d.last_longitude ?? d.longitude) : NaN;
    const hasLoc = !isNaN(dLat) && !isNaN(dLng);

    if (isHeadingToPickup(status) && hasLoc) {
      setHeading('Your driver is on the way', true);
      return;
    }

    let text = 'Pickup not started';
    const pickupDate = parsePickupDate(d);
    if (pickupDate && Date.now() < pickupDate.getTime() - EARLY_WINDOW_MS) {
      text = 'Real-time driver location sharing starts 60 minutes before your scheduled pickup time.';
    }
    setHeading(text, false);
  }

  function attachRealtimeListener() {
    if (unsubscribe) return;
    unsubscribe = onSnapshot(
      q,
      snap => {
        if (snap.empty) {
          detach('no-task-for-url');
          showPanel('not-found');
          return;
        }
        handleTaskDoc(snap.docs[0]);
      },
      err => { logErr('Firestore error', err); handleExpired(); },
    );
    log(`✅ onSnapshot | link_signature: ${linkSignature}`);
  }

  function startPolling() {
    clearPoll();
    pollTimer = setInterval(() => {
      getDocs(q)
        .then(snap => {
          if (snap.empty) {
            detach('no-task-for-url');
            showPanel('not-found');
            return;
          }
          handleTaskDoc(snap.docs[0]);
        })
        .catch(err => { logErr('Firestore poll error', err); handleExpired(); });
    }, POLL_MS);
  }

  function handleTaskDoc(docSnap) {
    readCount++;
    log(`📡 Read #${readCount} | exists: ${docSnap.exists()}`);
    if (!docSnap.exists()) { handleExpired(); return; }

    const d      = docSnap.data();
    const status = d.task_status;
    log(`   task_status: ${status}`);

    if (!initialised) {
      const storedToken = d.link_signature ?? d.token ?? d.tracking_token;
      if (!storedToken || storedToken !== linkSignature) { handleExpired(); return; }

      const expiryField = d.tracking_link_expires_at ?? d.token_expires_at ?? d.tokenExpiresAt;
      if (expiryField?.toDate() < new Date()) { handleExpired(); return; }

      const pLat = parseFloat(d.pickup_lat ?? d.pickupLat);
      const pLng = parseFloat(d.pickup_lng ?? d.pickupLng);
      if (isNaN(pLat) || isNaN(pLng)) { handleExpired(); return; }

      setupStaticUI(d);
      countdownTimer = startCountdown(expiryField);
      initialised    = true;
      showPanel('active');

      if (isArrivedOrBeyond(status)) {
        const dLat = parseFloat(d.last_latitude ?? d.latitude);
        const dLng = parseFloat(d.last_longitude ?? d.longitude);
        requestAnimationFrame(() => { initMap(dLat, dLng, pLat, pLng); handleArrived(); });
        return;
      }

      const dLat   = isLiveTrackingStatus(status) ? parseFloat(d.last_latitude ?? d.latitude)  : NaN;
      const dLng   = isLiveTrackingStatus(status) ? parseFloat(d.last_longitude ?? d.longitude) : NaN;
      const hasLoc = !isNaN(dLat) && !isNaN(dLng);

      applyPickupHeading(d, status);

      requestAnimationFrame(() => initMap(dLat, dLng, pLat, pLng));

      if (isLiveTrackingStatus(status)) {
        attachRealtimeListener();
        return;
      }

      startPolling();
      return;
    }

    if (isArrivedOrBeyond(status)) { handleArrived(); return; }

    if (isLiveTrackingStatus(status)) {
      if (!unsubscribe) {
        clearPoll();
        attachRealtimeListener();
      }
      const lat = parseFloat(d.last_latitude ?? d.latitude);
      const lng = parseFloat(d.last_longitude ?? d.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        setHeading('Your driver is on the way', true);
        updateDriverMarker(lat, lng);
      }
      return;
    }

    applyPickupHeading(d, status);
  }

  return {
    start() {
      log(`✅ Initial fetch | link_signature: ${linkSignature}`);
      getDocs(q)
        .then(snap => {
          if (snap.empty) {
            showPanel('not-found');
            return;
          }
          handleTaskDoc(snap.docs[0]);
        })
        .catch(err => { logErr('Firestore error', err); handleExpired(); });
    },
  };
}
