/* eslint-disable */
const admin = require("firebase-admin");

const createAuthUser = async ({ email, password, display_name }) => {
  return await admin.auth().createUser({
    email,
    password,
    displayName: display_name ? display_name : "",
  });
};

const getUserByEmail = async (email) => {
  try {
    return await admin.auth().getUserByEmail(email);
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

module.exports = { createAuthUser, getUserByEmail, setCustomClaims, deleteAuthUser };