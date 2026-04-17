import {
  doc,
  getDoc,
  onSnapshot,
} from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js';
import { log, logErr }                from './config.js';
import { isHeadingToPickup, isReachedPickup, isHeadedForDrop, isCompleted, isLiveTrackingStatus } from './status.js';
import { showPanel, setHeading, applyArrivedUI, applyTripCompletedUI, applyGuestPickedUpUI, setupStaticUI, startCountdown, parsePickupDate, showEarlyModal } from './ui.js';
import { initMap, updateDriverMarker, zoomToPickup, clearDriverOverlays, clearPickupAndRoute, switchToDropMode, showTripCompleted, hasDropLocation } from './map.js';

export function createTrackingController(db, { linkSignature, earlyWindowMinutes = 60 }) {
  let unsubscribe    = null;
  let initialised    = false;
  let countdownTimer = null;
  let readCount      = 0;
  let taskRef        = null;
  let switchedToDrop = false;

  function detach(reason) {
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
    log(`🔌 Detached | reason: ${reason} | reads: ${readCount}`);
  }

  function handleExpired() { detach('expired'); showPanel('expired'); }

  function handleArrived() {
    if (hasDropLocation()) {
      applyArrivedUI();
      return;
    }
    detach('arrived');
    applyArrivedUI();
  }

  function handleCompleted() {
    detach('completed');
    showTripCompleted();
    applyTripCompletedUI();
  }

  function handleHeadedForDrop(d) {
    if (!hasDropLocation()) {
      detach('headed-for-drop-no-drop-coords');
      clearPickupAndRoute();
      applyArrivedUI();
      return;
    }

    if (!switchedToDrop) {
      switchToDropMode();
      switchedToDrop = true;
    }
    applyGuestPickedUpUI();

    const lat = parseFloat(d.last_latitude ?? d.latitude);
    const lng = parseFloat(d.last_longitude ?? d.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      updateDriverMarker(lat, lng);
    }
  }

  const EARLY_WINDOW_MS = earlyWindowMinutes * 60 * 1000;

  function applyPickupHeading(d, status) {
    if (isHeadingToPickup(status)) {
      const dLat = parseFloat(d.last_latitude ?? d.latitude);
      const dLng = parseFloat(d.last_longitude ?? d.longitude);
      if (!isNaN(dLat) && !isNaN(dLng)) {
        setHeading('Your driver is on the way', true);
        return;
      }
    }

    setHeading('Pickup has not started yet', false);

    const pickupDate = parsePickupDate(d);
    if (pickupDate && Date.now() < pickupDate.getTime() - EARLY_WINDOW_MS) {
      showEarlyModal();
    }
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

      const dDropLat = parseFloat(d.drop_lat ?? d.dropLat);
      const dDropLng = parseFloat(d.drop_lng ?? d.dropLng);

      setupStaticUI(d);
      countdownTimer = startCountdown(expiryField);
      initialised    = true;
      showPanel('active');

      if (isCompleted(status)) {
        const dLat = parseFloat(d.last_latitude ?? d.latitude);
        const dLng = parseFloat(d.last_longitude ?? d.longitude);
        requestAnimationFrame(() => { initMap(dLat, dLng, pLat, pLng, dDropLat, dDropLng); handleCompleted(); });
        return;
      }

      if (isHeadedForDrop(status)) {
        const dLat = parseFloat(d.last_latitude ?? d.latitude);
        const dLng = parseFloat(d.last_longitude ?? d.longitude);
        const hasDrop = !isNaN(dDropLat) && !isNaN(dDropLng);
        requestAnimationFrame(() => {
          initMap(dLat, dLng, pLat, pLng, dDropLat, dDropLng);
          if (hasDrop) {
            handleHeadedForDrop(d);
          } else {
            clearPickupAndRoute();
            applyArrivedUI();
          }
        });
        if (hasDrop) attachRealtimeListener();
        return;
      }

      if (isReachedPickup(status)) {
        const dLat = parseFloat(d.last_latitude ?? d.latitude);
        const dLng = parseFloat(d.last_longitude ?? d.longitude);
        const hasDrop = !isNaN(dDropLat) && !isNaN(dDropLng);
        requestAnimationFrame(() => { initMap(dLat, dLng, pLat, pLng, dDropLat, dDropLng); handleArrived(); });
        if (hasDrop) {
          attachRealtimeListener();
        }
        return;
      }

      if (isHeadingToPickup(status)) {
        const dLat = parseFloat(d.last_latitude ?? d.latitude);
        const dLng = parseFloat(d.last_longitude ?? d.longitude);
        applyPickupHeading(d, status);
        requestAnimationFrame(() => initMap(dLat, dLng, pLat, pLng, dDropLat, dDropLng));
        attachRealtimeListener();
        return;
      }

      applyPickupHeading(d, status);
      requestAnimationFrame(() => initMap(NaN, NaN, pLat, pLng, dDropLat, dDropLng));

      const pickupDate = parsePickupDate(d);
      const withinWindow = pickupDate && Date.now() >= pickupDate.getTime() - EARLY_WINDOW_MS;
      if (withinWindow) {
        attachRealtimeListener();
      }
      return;
    }

    if (isCompleted(status)) { handleCompleted(); return; }

    const pickupDate = parsePickupDate(d);
    const withinWindow = pickupDate && Date.now() >= pickupDate.getTime() - EARLY_WINDOW_MS;

    if (!withinWindow) {
      detach('before-tracking-window');
      clearDriverOverlays();
      setHeading('Pickup has not started yet', false);
      showEarlyModal();
      return;
    }

    if (isHeadedForDrop(status)) { handleHeadedForDrop(d); return; }

    if (isReachedPickup(status)) { handleArrived(); return; }

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
