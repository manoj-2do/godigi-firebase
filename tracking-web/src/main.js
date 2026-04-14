import { initializeApp }              from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore }              from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { getRemoteConfig, fetchAndActivate, getValue } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-remote-config.js";
import { firebaseConfig, log, logErr } from './config.js';
import { showPanel, setEarlyModalMessage } from './ui.js';
import { createTrackingController }  from './controller.js';

const RC_DEFAULTS = { tracking_early_window_minutes: 60 };

function parseUrlParams() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  if (parts.length !== 2 || parts[0] !== 'track') {
    return null;
  }
  const linkSignature = decodeURIComponent(parts[1]);
  if (!linkSignature) {
    return null;
  }
  return { linkSignature };
}

async function fetchEarlyWindowMinutes(app) {
  try {
    const rc = getRemoteConfig(app);
    rc.defaultConfig = RC_DEFAULTS;
    log('Remote Config: fetchAndActivate started');
    await fetchAndActivate(rc);
    log('Remote Config: connected successfully');
    const minutes = getValue(rc, 'tracking_early_window_minutes').asNumber();
    log('Remote Config: tracking_early_window_minutes =', minutes);
    return minutes || RC_DEFAULTS.tracking_early_window_minutes;
  } catch (err) {
    logErr('Remote Config: fetch failed, using default', err);
    return RC_DEFAULTS.tracking_early_window_minutes;
  }
}

window.onload = async () => {
  showPanel('loader');

  const parsed = parseUrlParams();
  if (!parsed) {
    showPanel('not-found');
    return;
  }

  const app = initializeApp(firebaseConfig);
  const db  = getFirestore(app);

  const earlyWindowMinutes = await fetchEarlyWindowMinutes(app);
  setEarlyModalMessage(earlyWindowMinutes);

  createTrackingController(db, { ...parsed, earlyWindowMinutes }).start();
};
