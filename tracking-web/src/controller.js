import {
  collection,
  limit,
  onSnapshot,
  query,
  Timestamp,
  where,
} from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js';
import { log, logErr }                from './config.js';
import { isHeadingToPickup, isArrivedOrBeyond, isLiveTrackingStatus } from './status.js';
import { showPanel, setHeading, applyArrivedUI, setupStaticUI, startCountdown }      from './ui.js';
import { initMap, updateDriverMarker }                                                from './map.js';

export function createTrackingController(db, { linkSignature }) {
  let unsubscribe    = null;
  let initialised    = false;
  let countdownTimer = null;
  let readCount      = 0;

  function detach(reason) {
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
    log(`🔌 Detached | reason: ${reason} | reads: ${readCount}`);
  }

  function handleExpired() { detach('expired'); showPanel('expired'); }
  function handleArrived() { detach('arrived'); applyArrivedUI(); }

  function handleDocSnapshot(docSnap) {
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

      setHeading(
        isHeadingToPickup(status) && hasLoc ? 'Your driver is on the way' : 'Pickup not started',
        isHeadingToPickup(status) && hasLoc,
      );

      requestAnimationFrame(() => initMap(dLat, dLng, pLat, pLng));
      return;
    }

    if (isArrivedOrBeyond(status)) { handleArrived(); return; }

    if (isLiveTrackingStatus(status)) {
      const lat = parseFloat(d.last_latitude ?? d.latitude);
      const lng = parseFloat(d.last_longitude ?? d.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        setHeading('Your driver is on the way', true);
        updateDriverMarker(lat, lng);
      }
    }
  }

  return {
    start() {
      const q = query(
        collection(db, 'tasks'),
        where('link_signature', '==', linkSignature),
        where('tracking_link_expires_at', '>', Timestamp.now()),
        limit(1),
      );
      unsubscribe = onSnapshot(
        q,
        snap => {
          if (snap.empty) {
            detach('no-task-for-url');
            showPanel('not-found');
            return;
          }
          handleDocSnapshot(snap.docs[0]);
        },
        err => { logErr('Firestore error', err); handleExpired(); },
      );
      log(`✅ Query listener | link_signature: ${linkSignature}`);
    },
  };
}
