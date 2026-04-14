/* eslint-disable */
const admin = require("firebase-admin");
const config = require("../config");
const { FieldValue } = require("firebase-admin/firestore");
const { buildTrackingLink } = require("../utils/tracking_link");

const createUserInFirestore = async (uid, doc) => {
  await admin.firestore().collection(config.collections.users).doc(uid).set({
    ...doc,
    uid,
    status: true,
    created_at: FieldValue.serverTimestamp(),
  });
};

const createSupplierConfigInFirestore = async (supplier_id,  encrypted_key, name ) => {
  await admin.firestore().collection(config.collections.supplierConfig).doc(`${supplier_id}`).set({
    supplier_id,
    key: encrypted_key ? encrypted_key : "",
    name: name ? name : "",
    created_at: FieldValue.serverTimestamp(),
  });
};

const createTripTrackingInFirestore = async (job_id, data) => {
  const ref = admin.firestore().collection(config.collections.tripTracking).doc(`${job_id}`);
  await ref.set(data, { merge: true });
};

const createTaskInFirestore = async (task_id, data) => {
  const db = admin.firestore();
  const taskRef = db.collection(config.collections.tasks).doc(`${task_id}`);
  const linkRef = db.collection(config.collections.trackingLinks).doc(data.link_signature);
  await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(taskRef);
    if (snap.exists) {
      const oldSig = snap.data().link_signature;
      if (oldSig != null && String(oldSig) !== String(data.link_signature)) {
        const oldLinkRef = db.collection(config.collections.trackingLinks).doc(String(oldSig));
        transaction.delete(oldLinkRef);
      }
    }
    transaction.set(taskRef, data);
    transaction.set(linkRef, {
      task_id: `${task_id}`,
      link_signature: data.link_signature,
      tracking_link_expires_at: data.tracking_link_expires_at,
      url: buildTrackingLink(data.link_signature),
    });
  });
};

const createSupplierInFirestore = async (supplier_id, data) => {
  const db = admin.firestore();
  const ref = db.collection(config.collections.suppliers).doc(`${supplier_id}`);
  await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    if (snap.exists) {
      const err = new Error("A supplier with this supplier_id already exists");
      err.code = "SUPPLIER_ID_ALREADY_EXISTS";
      throw err;
    }
    transaction.set(ref, data);
  });
};

module.exports = {
  createSupplierConfigInFirestore,
  createSupplierInFirestore,
  createUserInFirestore,
  createTripTrackingInFirestore,
  createTaskInFirestore
};
