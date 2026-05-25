import { logErr } from './config.js';

/** Display scale (viewBox stays 80×104 so artwork scales uniformly). */
const PILL_VISUAL_SCALE = 0.78;
const PILL_W = Math.round(80 * PILL_VISUAL_SCALE);
const PILL_H = Math.round(104 * PILL_VISUAL_SCALE);
/** Bottom of avatar circle in viewBox (40,68)+r22 → y=90; scaled for map anchor. */
const PILL_MARKER_SIZE   = [PILL_W, PILL_H];
const PILL_MARKER_ANCHOR = [
  Math.round(40 * PILL_VISUAL_SCALE),
  Math.round(90 * PILL_VISUAL_SCALE),
];
const PILL_POPUP_ANCHOR_Y = -Math.round(82 * PILL_VISUAL_SCALE);

/** Unique filter ids per marker so two instances on one page both render shadows. */
const SVG_TRAVELER_PILL = `<svg xmlns="http://www.w3.org/2000/svg" width="${PILL_W}" height="${PILL_H}" viewBox="0 0 80 104" fill="none">
<defs>
<filter id="pm-tr-f1" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000" flood-opacity="0.18"/></filter>
<filter id="pm-tr-f2" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#000" flood-opacity="0.22"/></filter>
</defs>
<g filter="url(#pm-tr-f1)">
<rect x="22" y="6" width="36" height="28" rx="14" fill="#1B9D7A"/>
<path d="M36 34 L40 40 L44 34 Z" fill="#1B9D7A"/>
<text x="40" y="24" font-family="Inter,system-ui,-apple-system,Helvetica,Arial,sans-serif" font-size="13" font-weight="600" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.1">You</text>
</g>
<g filter="url(#pm-tr-f2)" transform="translate(40 68)">
<circle r="22" fill="#FFFFFF"/><circle r="19" fill="#1B9D7A"/>
<g stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">
<circle cx="0" cy="-3.5" r="4"/><path d="M-7.5 8.5 C -7.5 4 -4 1 0 1 C 4 1 7.5 4 7.5 8.5"/>
</g></g></svg>`;

const SVG_DRIVER_PILL = `<svg xmlns="http://www.w3.org/2000/svg" width="${PILL_W}" height="${PILL_H}" viewBox="0 0 80 104" fill="none">
<defs>
<filter id="pm-dr-f1" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000" flood-opacity="0.18"/></filter>
<filter id="pm-dr-f2" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#000" flood-opacity="0.22"/></filter>
</defs>
<g filter="url(#pm-dr-f1)">
<rect x="15" y="6" width="50" height="28" rx="14" fill="#5A5BD6"/>
<path d="M36 34 L40 40 L44 34 Z" fill="#5A5BD6"/>
<text x="40" y="24" font-family="Inter,system-ui,-apple-system,Helvetica,Arial,sans-serif" font-size="13" font-weight="600" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.1">Driver</text>
</g>
<g filter="url(#pm-dr-f2)" transform="translate(40 68)">
<circle r="22" fill="#FFFFFF"/><circle r="19" fill="#5A5BD6"/>
<g stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">
<circle r="9"/><circle r="2.2" fill="#FFFFFF"/>
<line x1="0" y1="-2.2" x2="0" y2="-8"/><line x1="-2.2" y1="0.6" x2="-6.8" y2="3.8"/><line x1="2.2" y1="0.6" x2="6.8" y2="3.8"/>
</g></g></svg>`;

let map, driverMarker, pickupMarker, dropMarker, routeLine;
let pickupLat, pickupLng, dropLat, dropLng;
let currentTarget = 'pickup'; // 'pickup' | 'drop'

/** @type {((p: { distanceMeters: number, durationSeconds: number, phase: 'pickup'|'drop' } | null) => void) | null} */
let routeMetricsListener = null;

const ROUTE_FETCH_MIN_MS = 20_000;
const ROUTE_MIN_MOVE_M = 200;

let lastRouteFetchAt = 0;
let lastRouteDriverLat = NaN;
let lastRouteDriverLng = NaN;
/** @type {'pickup'|'drop'|null} */
let lastRouteTargetPhase = null;

export function setRouteMetricsListener(fn) {
  routeMetricsListener = fn;
}

function resetRouteFetchState() {
  lastRouteFetchAt       = 0;
  lastRouteDriverLat     = NaN;
  lastRouteDriverLng     = NaN;
  lastRouteTargetPhase   = null;
}

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const p = Math.PI / 180;
  const a = 0.5 - Math.cos((lat2 - lat1) * p) / 2
    + Math.cos(lat1 * p) * Math.cos(lat2 * p) * (1 - Math.cos((lng2 - lng1) * p)) / 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function shouldSkipOsrmFetch(dLat, dLng) {
  if (currentTarget !== lastRouteTargetPhase) return false;
  const elapsed = Date.now() - lastRouteFetchAt;
  if (elapsed >= ROUTE_FETCH_MIN_MS) return false;
  if (Number.isNaN(lastRouteDriverLat)) return false;
  const moved = haversineMeters(dLat, dLng, lastRouteDriverLat, lastRouteDriverLng);
  return moved < ROUTE_MIN_MOVE_M;
}

function makePickupIcon() {
  return L.divIcon({
    className:   'pill-leaflet-marker',
    html:        `<div class="pill-marker-root" style="width:${PILL_W}px;height:${PILL_H}px;line-height:0">${SVG_TRAVELER_PILL}</div>`,
    iconSize:    PILL_MARKER_SIZE,
    iconAnchor:  PILL_MARKER_ANCHOR,
    popupAnchor: [0, PILL_POPUP_ANCHOR_Y],
  });
}

function makeDropIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
      <div style="background:#DC2626;color:white;font-size:11px;font-weight:600;padding:3px 8px;border-radius:20px;white-space:nowrap;box-shadow:0 2px 6px rgba(220,38,38,0.4);">Drop point</div>
      <div style="width:16px;height:16px;background:#DC2626;border:2.5px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>
    </div>`,
    iconSize: [90, 42], iconAnchor: [45, 34],
  });
}

function makeDriverIcon() {
  return L.divIcon({
    className:   'pill-leaflet-marker',
    html:        `<div class="pill-marker-root" style="width:${PILL_W}px;height:${PILL_H}px;line-height:0">${SVG_DRIVER_PILL}</div>`,
    iconSize:    PILL_MARKER_SIZE,
    iconAnchor:  PILL_MARKER_ANCHOR,
    popupAnchor: [0, PILL_POPUP_ANCHOR_Y],
  });
}

function addZoomControl() {
  const ZoomCtrl = L.Control.extend({
    onAdd() {
      const wrap = L.DomUtil.create('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;gap:4px;margin:10px;margin-bottom:40px;';
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
  new ZoomCtrl({ position: 'bottomright' }).addTo(map);
}

function getTargetLatLng() {
  if (currentTarget === 'drop' && !isNaN(dropLat) && !isNaN(dropLng)) {
    return { lat: dropLat, lng: dropLng };
  }
  return { lat: pickupLat, lng: pickupLng };
}

async function drawRoute(dLat, dLng) {
  if (!map) return;
  if (shouldSkipOsrmFetch(dLat, dLng)) return;
  try {
    const phase = currentTarget;
    const t = getTargetLatLng();
    const url  = `https://router.project-osrm.org/route/v1/driving/${dLng},${dLat};${t.lng},${t.lat}?overview=full&geometries=geojson`;
    const data = await fetch(url).then(r => r.json());
    if (!data.routes?.length) return;
    const route = data.routes[0];
    const coords = route.geometry.coordinates.map(([lo, la]) => [la, lo]);
    if (routeLine) map.removeLayer(routeLine);
    routeLine = L.polyline(coords, { color: '#2563EB', weight: 5, opacity: 0.85 }).addTo(map);
    routeLine.bringToBack();

    alignMarkersToRouteGeometry(coords, phase);

    lastRouteFetchAt     = Date.now();
    lastRouteDriverLat   = dLat;
    lastRouteDriverLng   = dLng;
    lastRouteTargetPhase = phase;

    const distanceMeters   = typeof route.distance === 'number' ? route.distance : NaN;
    const durationSeconds  = typeof route.duration === 'number' ? route.duration : NaN;
    if (!Number.isNaN(distanceMeters) && routeMetricsListener) {
      routeMetricsListener({
        distanceMeters,
        durationSeconds: Number.isNaN(durationSeconds) ? 0 : durationSeconds,
        phase: phase === 'drop' ? 'drop' : 'pickup',
      });
    }
  } catch (e) { logErr('OSRM error', e); }
}

function fitToMarkers(dLat, dLng, animate = true) {
  const t = getTargetLatLng();
  map.fitBounds(
    L.latLngBounds([[dLat, dLng], [t.lat, t.lng]]),
    { padding: [80, 80], maxZoom: 18, animate },
  );
}

/** OSRM geometry is snapped to roads; raw GPS/address can sit off the line — pin endpoints to the polyline. */
function alignMarkersToRouteGeometry(coords, phase) {
  if (!coords?.length) return;
  const start = coords[0];
  const end   = coords[coords.length - 1];
  if (driverMarker) driverMarker.setLatLng(start);
  if (phase === 'pickup' && pickupMarker) pickupMarker.setLatLng(end);
  if (phase === 'drop' && dropMarker) dropMarker.setLatLng(end);
  map.fitBounds(
    L.latLngBounds([start, end]),
    { padding: [80, 80], maxZoom: 18, animate: true },
  );
}

export function initMap(driverLat, driverLng, pLat, pLng, dLat, dLng) {
  pickupLat = pLat;
  pickupLng = pLng;
  dropLat   = dLat;
  dropLng   = dLng;

  map = L.map('map', {
    zoomControl:        false,
    attributionControl: false,
    minZoom:            3,
    maxZoom:            20,
    scrollWheelZoom:    false,
    doubleClickZoom:    false,
    touchZoom:          true,
    dragging:           true,
  });

  L.tileLayer('https://mt1.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}', { maxZoom: 20 }).addTo(map);
  addZoomControl();

  pickupMarker = L.marker([pLat, pLng], { icon: makePickupIcon() }).addTo(map);

  const hasDriver = !isNaN(driverLat) && !isNaN(driverLng);
  if (hasDriver) {
    driverMarker = L.marker([driverLat, driverLng], { icon: makeDriverIcon(), zIndexOffset: 1000 }).addTo(map);
    drawRoute(driverLat, driverLng);
  }

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

export function zoomToPickup() {
  if (!map || isNaN(pickupLat) || isNaN(pickupLng)) return;
  map.flyTo([pickupLat, pickupLng], 20, { duration: 0.8 });
}

export function clearDriverOverlays() {
  if (driverMarker) { map.removeLayer(driverMarker); driverMarker = null; }
  if (routeLine) { map.removeLayer(routeLine); routeLine = null; }
  resetRouteFetchState();
  routeMetricsListener?.(null);
  if (map && !isNaN(pickupLat) && !isNaN(pickupLng)) {
    map.flyTo([pickupLat, pickupLng], 16, { duration: 0.5 });
  }
}

export function clearPickupAndRoute() {
  if (pickupMarker) { map.removeLayer(pickupMarker); pickupMarker = null; }
  if (routeLine)    { map.removeLayer(routeLine);    routeLine    = null; }
  resetRouteFetchState();
  routeMetricsListener?.(null);
  if (driverMarker && map) {
    map.flyTo(driverMarker.getLatLng(), 16, { duration: 0.5 });
  }
}

export function switchToDropMode() {
  if (isNaN(dropLat) || isNaN(dropLng)) return;

  currentTarget = 'drop';

  if (pickupMarker) { map.removeLayer(pickupMarker); pickupMarker = null; }

  dropMarker = L.marker([dropLat, dropLng], { icon: makeDropIcon() }).addTo(map);
}

export function showTripCompleted() {
  if (!map) return;
  const hasDrop = !isNaN(dropLat) && !isNaN(dropLng);
  const target = hasDrop
    ? [dropLat, dropLng]
    : (driverMarker ? driverMarker.getLatLng() : [pickupLat, pickupLng]);
  map.flyTo(target, 16, { duration: 0.5 });
}

export function updateDriverMarker(lat, lng) {
  if (!driverMarker) {
    driverMarker = L.marker([lat, lng], { icon: makeDriverIcon(), zIndexOffset: 1000 }).addTo(map);
  } else {
    driverMarker.setLatLng([lat, lng]);
  }
  fitToMarkers(lat, lng);
  drawRoute(lat, lng);
}

export function hasDropLocation() {
  return !isNaN(dropLat) && !isNaN(dropLng);
}
