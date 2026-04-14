import {
  doc,
  getDoc,
  onSnapshot,
} from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js';
import { log, logErr }                from './config.js';
import { isHeadingToPickup, isArrivedOrBeyond, isLiveTrackingStatus, isPrePickup } from './status.js';
import { showPanel, setHeading, applyArrivedUI, setupStaticUI, startCountdown, parsePickupDate } from './ui.js';
import { initMap, updateDriverMarker, zoomToPickup, clearDriverOverlays }               from './map.js';

const EARLY_WINDOW_MS = 60 * 60 * 1000;

export function createTrackingController(db, { linkSignature }) {
  let unsubscribe    = null;
  let initialised    = false;
  let countdownTimer = null;
  let readCount      = 0;
  let taskRef        = null;

  function detach(reason) {
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }
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

    if (isPrePickup(status)) {
      setHeading('Real-time driver location sharing starts 60 minutes before your scheduled pickup time.', false);
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
    if (unsubscribe || !taskRef) return;
    unsubscribe = onSnapshot(
      taskRef,
      snap => {
        if (!snap.exists()) {
          detach('no-task-for-url');
          showPanel('not-found');
          return;
        }
        handleTaskDoc(snap);
      },
      err => { logErr('Firestore error', err); handleExpired(); },
    );
    log(`✅ onSnapshot | task: ${taskRef.path}`);
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

      const dLat = isLiveTrackingStatus(status) ? parseFloat(d.last_latitude ?? d.latitude)  : NaN;
      const dLng = isLiveTrackingStatus(status) ? parseFloat(d.last_longitude ?? d.longitude) : NaN;

      applyPickupHeading(d, status);
      requestAnimationFrame(() => initMap(dLat, dLng, pLat, pLng));

      if (!isPrePickup(status)) {
        attachRealtimeListener();
      }
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
      return;
    }

    clearDriverOverlays();
    applyPickupHeading(d, status);
  }

  async function resolveTaskId() {
    const linkDoc = await getDoc(doc(db, 'tracking_links', linkSignature));
    if (!linkDoc.exists()) return null;

    const data = linkDoc.data();
    if (data.tracking_link_expires_at?.toDate() < new Date()) return null;

    return data.task_id;
  }

  return {
    async start() {
      log(`✅ Resolving task via tracking_links/${linkSignature}`);
      try {
        const taskId = await resolveTaskId();
        if (!taskId) {
          showPanel('not-found');
          return;
        }

        taskRef = doc(db, 'tasks', taskId);
        const snap = await getDoc(taskRef);
        if (!snap.exists()) {
          showPanel('not-found');
          return;
        }
        handleTaskDoc(snap);
      } catch (err) {
        logErr('Firestore error', err);
        handleExpired();
      }
    },
  };
}
