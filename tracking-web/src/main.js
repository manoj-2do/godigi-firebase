import { initializeApp }              from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore }              from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { firebaseConfig }            from './config.js';
import { showPanel }                 from './ui.js';
import { createTrackingController }  from './controller.js';

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

window.onload = () => {
  showPanel('loader');

  const parsed = parseUrlParams();
  if (!parsed) {
    showPanel('not-found');
    return;
  }

  const app = initializeApp(firebaseConfig);
  const db  = getFirestore(app);

  createTrackingController(db, parsed).start();
};
