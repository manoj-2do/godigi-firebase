/* eslint-disable */
const admin = require("firebase-admin");

exports.getActiveDevicesFromUserDoc = async (fleet_id) => {
  const fleetIdNum = Number(fleet_id);
  if (!Number.isInteger(fleetIdNum)) {
    return [];
  }

  const db = admin.firestore();
  const usersSnap = await db
    .collection("users")
    .where("fleet_id", "==", fleetIdNum)
    .limit(1)
    .get();

  if (usersSnap.empty) {
    return [];
  }

  const userRef = usersSnap.docs[0].ref;
  const snapshot = await userRef
    .collection("devices")
    .where("is_active", "==", true)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};