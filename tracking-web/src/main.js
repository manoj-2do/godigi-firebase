import { initializeApp }              from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore }              from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { firebaseConfig }            from './config.js';
import { showPanel }                 from './ui.js';
import { createTrackingController }  from './controller.js';

function parseUrlParams() {
  const parts  = window.location.pathname.split('/').filter(Boolean);
  const token  = parts.pop()?.replace(/[^a-zA-Z0-9-]/g, '');
  const taskId = parts.pop()?.replace(/[^a-zA-Z0-9-]/g, '');
  return { token, taskId };
}

window.onload = () => {
  showPanel('loader');

  const { token, taskId } = parseUrlParams();
  if (!token || !taskId) { showPanel('not-found'); return; }

  const app = initializeApp(firebaseConfig);
  const db  = getFirestore(app);

  createTrackingController(db, taskId, token).start();
};