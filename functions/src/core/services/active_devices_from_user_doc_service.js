/* eslint-disable */
const admin = require("firebase-admin");

exports.getActiveDevicesFromUserDoc = async (uid) => {
  const snapshot = await admin
    .firestore()
    .collection("users")
    .doc(uid)
    .collection("devices")
    .where("is_active", "==", true)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};