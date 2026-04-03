/* eslint-disable */
const admin = require("firebase-admin");

exports.sendPushToDevice = async (device, { fleet_id, job_ids, title, body, data }) => {
    const fcmToken = device.fcm_token;

    if (!fcmToken) {
        return {
        device_doc_id: device.id,
        status: "skipped",
        reason: "no_fcm_token",
        created_at: new Date().toISOString(),
        };
    }

    let payloadData = {};
    if (data && typeof data === "object" && !Array.isArray(data)) {
        payloadData = { ...data };
    }

  
    if (fleet_id) {
        payloadData.fleet_id = `${fleet_id}`;
    }

    if (Array.isArray(job_ids) && job_ids.length > 0) {
        payloadData.job_ids = job_ids.join(",");
    }

    try {
        const messageId = await admin.messaging().send({
            token: fcmToken,
            notification: { title, body },
            data: payloadData,
        });

        return {
            device_doc_id: device.id,
            status: "sent",
            message_id: messageId,
            created_at: new Date().toISOString(),
        };
    } catch (e) {
        return {
            device_doc_id: device.id,
            status: "failed",
            reason: e.message,
            created_at: new Date().toISOString(),
        };
    }
};