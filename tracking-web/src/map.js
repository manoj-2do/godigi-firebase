import { logErr } from './config.js';

let map, driverMarker, pickupMarker, routeLine;
let pickupLat, pickupLng;

function makePickupIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
      <div style="background:#1E293B;color:white;font-size:11px;font-weight:600;padding:3px 8px;border-radius:20px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3);">Pickup point</div>
      <div style="width:16px;height:16px;background:#2563EB;border:2.5px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>
    </div>`,
    iconSize: [90, 42], iconAnchor: [45, 42],
  });
}

function makeDriverIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
      <div style="background:#2563EB;color:white;font-size:11px;font-weight:600;padding:3px 8px;border-radius:20px;white-space:nowrap;box-shadow:0 2px 6px rgba(37,99,235,0.4);">Driver</div>
      <div style="width:22px;height:22px;background:#2563EB;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>
    </div>`,
    iconSize: [90, 48], iconAnchor: [45, 48],
  });
}

function addZoomControl() {
  const ZoomCtrl = L.Control.extend({
    onAdd() {
      const wrap = L.DomUtil.create('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;gap:4px;margin:10px;';
      const style = 'width:36px;height:36px;background:white;border:none;border-radius:8px;font-size:20px;font-weight:500;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.2);color:#1E293B;line-height:1;';
      const btnIn  = L.DomUtil.create('button', '', wrap); btnIn.innerHTML  = '+'; btnIn.style.cssText = style;
      const btnOut = L.DomUtil.create('button', '', wrap); btnOut.innerHTML = '−'; btnOut.style.cssText = style;
      L.DomEvent.on(btnIn,  'click', e => { L.DomEvent.stopPropagation(e); map.zoomIn(); });
      L.DomEvent.on(btnOut, 'click', e => { L.DomEvent.stopPropagation(e); if (map.getZoom() > map.getMinZoom()) map.zoomOut(); });
      const syncOut = () => { const atMin = map.getZoom() <= map.getMinZoom(); btnOut.style.color = atMin ? '#CBD5E1' : '#1E293B'; btnOut.style.cursor = atMin ? 'not-allowed' : 'pointer'; };
      map.on('zoomend', syncOut); setTimeout(syncOut, 0);
      return wrap;
    },
  });
  new ZoomCtrl({ position: 'topright' }).addTo(map);
}

async function drawRoute(dLat, dLng) {
  try {
    const url  = `https://router.project-osrm.org/route/v1/driving/${dLng},${dLat};${pickupLng},${pickupLat}?overview=full&geometries=geojson`;
    const data = await fetch(url).then(r => r.json());
    if (!data.routes?.length) return;
    const coords = data.routes[0].geometry.coordinates.map(([lo, la]) => [la, lo]);
    if (routeLine) map.removeLayer(routeLine);
    routeLine = L.polyline(coords, { color: '#2563EB', weight: 5, opacity: 0.85 }).addTo(map);
    routeLine.bringToBack();
  } catch (e) { logErr('OSRM error', e); }
}

function fitToMarkers(dLat, dLng, animate = false) {
  map.fitBounds(
    L.latLngBounds([[dLat, dLng], [pickupLat, pickupLng]]),
    { padding: [80, 80], maxZoom: 17, animate },
  );
}

export function initMap(driverLat, driverLng, pLat, pLng) {
  pickupLat = pLat;
  pickupLng = pLng;

  map = L.map('map', {
    zoomControl:        false,
    attributionControl: false,
    minZoom:            3,
    maxZoom:            18,
    scrollWheelZoom:    false,
    doubleClickZoom:    false,
    touchZoom:          true,
    dragging:           true,
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);
  addZoomControl();

  pickupMarker = L.marker([pLat, pLng], { icon: makePickupIcon() }).addTo(map);

  const hasDriver = !isNaN(driverLat) && !isNaN(driverLng);
  if (hasDriver) {
    driverMarker = L.marker([driverLat, driverLng], { icon: makeDriverIcon(), zIndexOffset: 1000 }).addTo(map);
    drawRoute(driverLat, driverLng);
  }

  // Always start on pickup, then refit after container size is known
  map.setView([pLat, pLng], 14);
  setTimeout(() => {
    map.invalidateSize();
    if (hasDriver) {
      fitToMarkers(driverLat, driverLng);
    } else {
      map.setView([pLat, pLng], 16);
    }
  }, 200);
}

export function updateDriverMarker(lat, lng) {
  if (!driverMarker) {
    driverMarker = L.marker([lat, lng], { icon: makeDriverIcon(), zIndexOffset: 1000 }).addTo(map);
  } else {
    driverMarker.setLatLng([lat, lng]);
  }
  drawRoute(lat, lng);
}