import { doc, onSnapshot }            from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { log, logErr }                from './config.js';
import { isHeadingToPickup, isArrivedOrBeyond, isLiveTrackingStatus } from './status.js';
import { showPanel, setHeading, applyArrivedUI, setupStaticUI, startCountdown }      from './ui.js';
import { initMap, updateDriverMarker }                                                from './map.js';

export function createTrackingController(db, taskId, token) {
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

  function handleSnapshot(snap) {
    readCount++;
    log(`📡 Read #${readCount} | exists: ${snap.exists()}`);
    if (!snap.exists()) { handleExpired(); return; }

    const d      = snap.data();
    const status = d.task_status;
    log(`   task_status: ${status}`);

    if (!initialised) {
      const storedToken = d.token ?? d.tracking_token;
      if (!storedToken || storedToken !== token) { handleExpired(); return; }

      const expiryField = d.token_expires_at ?? d.tokenExpiresAt;
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
      unsubscribe = onSnapshot(
        doc(db, 'tasks', String(taskId)),
        handleSnapshot,
        err => { logErr('Firestore error', err); handleExpired(); },
      );
      log(`✅ Listener attached | taskId: ${taskId}`);
    },
  };
}