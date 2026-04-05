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
  setHeading('Driver arrived', false);
}

export function setupStaticUI(d) {
  $('address-val').innerText     = d.pick_up ?? d.pickupAddress ?? 'No address provided';
  const name                     = d.driver_name ?? d.driverName ?? 'Driver';
  $('driver-name-val').innerText = name;
  $('avatar-val').innerText      = name.charAt(0).toUpperCase();

  const phone   = d.driver_phone_number ?? d.driverPhoneNumber ?? '';
  const callBtn = $('call-btn');
  if (phone) {
    callBtn.href = `tel:${phone}`;
  } else {
    callBtn.style.opacity      = '0.4';
    callBtn.style.pointerEvents = 'none';
  }

  const pickupTime = d.pick_up_time ?? d.scheduledTime;
  if (pickupTime) {
    const t = pickupTime.toDate ? pickupTime.toDate() : new Date(pickupTime);
    $('pickup-time-val').innerText = t.toLocaleString([], {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }
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