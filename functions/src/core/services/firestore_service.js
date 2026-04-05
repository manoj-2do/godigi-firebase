/* eslint-disable */
const admin = require("firebase-admin");
const config = require("../config");
const { FieldValue } = require("firebase-admin/firestore");

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
  const ref = admin.firestore().collection(config.collections.tasks).doc(`${task_id}`);
  await ref.set(data, { merge: true });
};

module.exports = {
  createSupplierConfigInFirestore,
  createUserInFirestore,
  createTripTrackingInFirestore,
  createTaskInFirestore
};
