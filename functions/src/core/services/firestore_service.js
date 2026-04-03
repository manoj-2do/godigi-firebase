/* eslint-disable */
const admin = require("firebase-admin");
const config = require("../config");
const { FieldValue } = require("firebase-admin/firestore");

//Replacing this 
const createUserInFirestore = async (uid, {email, display_name, phone_number, fleet_id, supplier_id}) => {
  await admin.firestore().collection(config.collections.users).doc(`${fleet_id}`).set({
    uid,
    email,
    display_name: display_name ? display_name : "",
    phone_number: phone_number ? phone_number : "",
    fleet_id: fleet_id ? fleet_id : null,
    supplier_id: supplier_id ? supplier_id : null,
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
