/* eslint-disable */
const admin = require("firebase-admin");

const createAuthUserWithEmail = async ({ email, password, display_name }) => {
  const userRecord = await admin.auth().createUser({
    email,
    password,
    displayName: display_name ? display_name : "",
  });
  if (!userRecord || !userRecord.uid) {
    const err = new Error("Failed to create auth user");
    err.code = "auth/user-creation-failed";
    throw err;
  }
  return userRecord;
};

const createAuthUserWithPhone = async ({ phone_number, display_name }) => {
  const userRecord = await admin.auth().createUser({
    phoneNumber: phone_number,
    displayName: display_name ? display_name : "",
  });
  if (!userRecord || !userRecord.uid) {
    const err = new Error("Failed to create auth user");
    err.code = "auth/user-creation-failed";
    throw err;
  }
  return userRecord;
};

const getUserByEmail = async (email) => {
  try {
    return await admin.auth().getUserByEmail(email);
  } catch (e) {
    if (e.code === "auth/user-not-found") return null;
    throw e;
  }
};

const getUserByPhoneNumber = async (phone_number) => {
  try {
    return await admin.auth().getUserByPhoneNumber(phone_number);
  } catch (e) {
    if (e.code === "auth/user-not-found") return null;
    throw e;
  }
};

const setCustomClaims = async (uid, claims) => {
  await admin.auth().setCustomUserClaims(uid, claims);
};

const deleteAuthUser = async (uid) => {
  await admin.auth().deleteUser(uid);
};

const updateAuthUser = async (uid, { phone_number, display_name }) => {
  const patch = {};
  if (phone_number) patch.phoneNumber = phone_number;
  if (display_name !== undefined) patch.displayName = display_name;
  if (Object.keys(patch).length === 0) return;
  await admin.auth().updateUser(uid, patch);
};

module.exports = {
  createAuthUserWithEmail,
  createAuthUserWithPhone,
  getUserByEmail,
  getUserByPhoneNumber,
  updateAuthUser,
  setCustomClaims,
  deleteAuthUser,
};
