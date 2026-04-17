export const $ = id => document.getElementById(id);

export function showPanel(name) {
  ['loader', 'expired', 'not-found', 'active'].forEach(id => {
    $(id).classList.toggle('visible', id === name);
  });
}

export function setHeading(text, showBadge) {
  $('headingText').innerText = text;
  const badge = document.querySelector('.live-badge');
  badge.style.display = showBadge ? 'inline-flex' : 'none';
}

export function applyArrivedUI() {
  $('map-container').classList.add('arrived');
  $('arrived-banner').style.display = 'block';
  $('completed-banner').style.display = 'none';
  setHeading('Driver is at the Pickup point', false);
}

export function applyTripCompletedUI() {
  $('map-container').classList.add('arrived');
  $('arrived-banner').style.display = 'none';
  $('completed-banner').style.display = 'block';
  setHeading('Trip completed', false);
}

export function applyGuestPickedUpUI() {
  $('map-container').classList.remove('arrived');
  $('arrived-banner').style.display = 'none';
  $('completed-banner').style.display = 'none';
  setHeading('Heading to drop location', true);
}

/** @returns {Date|null} */
export function parsePickupDate(d) {
  const pickupTime = d.pick_up_time ?? d.scheduledTime;
  if (pickupTime == null) return null;
  try {
    const t = pickupTime.toDate ? pickupTime.toDate() : new Date(pickupTime);
    return Number.isNaN(t.getTime()) ? null : t;
  } catch {
    return null;
  }
}

export function setupStaticUI(d) {
  $('address-val').innerText     = d.pick_up ?? d.pickupAddress ?? 'No address provided';
  const name                     = d.driver_name ?? d.driverName ?? 'Driver';
  $('driver-name-val').innerText = name;
  $('avatar-val').innerText      = name.charAt(0).toUpperCase();

  const vehicleRaw = d.vehicle_number ?? d.vehicleNumber ?? '';
  const vehicle    = typeof vehicleRaw === 'string' ? vehicleRaw.trim() : String(vehicleRaw ?? '').trim();
  const vehWrap    = $('driver-vehicle-wrap');
  const vehVal     = $('driver-vehicle-val');
  if (vehicle) {
    vehVal.textContent = vehicle;
    vehWrap.hidden     = false;
  } else {
    vehVal.textContent = '';
    vehWrap.hidden     = true;
  }

  const phone   = d.driver_phone_number ?? d.driverPhoneNumber ?? '';
  const callBtn = $('call-btn');
  if (phone) {
    callBtn.href = `tel:${phone}`;
  } else {
    callBtn.style.opacity      = '0.4';
    callBtn.style.pointerEvents = 'none';
  }

  const t = parsePickupDate(d);
  if (t) {
    $('pickup-time-val').innerText = t.toLocaleString([], {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }
}

export function setEarlyModalMessage(minutes) {
  const p = document.querySelector('#early-modal .modal-card p');
  if (p) p.textContent = `Real-time driver location sharing will be enabled ${minutes} minutes before your scheduled pickup time.`;
}

export function showEarlyModal() {
  const overlay = $('early-modal');
  overlay.classList.add('visible');
  $('early-modal-close').onclick = () => overlay.classList.remove('visible');
  overlay.onclick = (e) => { if (e.target === overlay) overlay.classList.remove('visible'); };
}

export function startCountdown(expiryField) {
  if (!expiryField) return null;
  const expiresAt = expiryField.toDate();
  return setInterval(() => {
    const diff = expiresAt - new Date();
    if (diff <= 0) { window.location.reload(); return; }
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    $('countdown-val').innerText = `Link expires in ${h}h ${m}m`;
  }, 1000);
}