const admin = require("firebase-admin");
const config = require("../config");
const {FieldValue} = require("firebase-admin/firestore");

const logAudit = async ({action, targetEmail, targetUid}) => {
  await admin.firestore().collection(config.collections.auditLogs).add({
    action,
    targetEmail,
    targetUid,
    timestamp: FieldValue.serverTimestamp(),
  });
};

module.exports = {logAudit};
