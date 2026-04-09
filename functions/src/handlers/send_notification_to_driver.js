/* eslint-disable */

const { onRequest } = require("firebase-functions/v2/https");
const { validateSecret } = require("../core/middleware/validate_secret");
const { getActiveDevicesFromUserDoc } = require("../core/services/active_devices_from_user_doc_service");
const { sendPushToDevice } = require("../core/services/send_push_to_device");
const config = require("../core/config");
const admin = require("firebase-admin");
const { validateNotificationPayload } = require("../core/validators/notification_payload_validators");


exports.sendNotificationToDriver = onRequest(
  async (request, response) => {
    if (!validateSecret(request, response)) return;
    
    /**
     * title -> Notification UI Title
     * body -> Notification UI Subtitle
     * data -> Notification data obj
     *      Example of data: 
     *              {
     *                  "screen": "upcoming_trips_tomorrow",
     *                  "fleet_id": 1290023, 
     *              }
     */
    const { fleet_id, task_ids, title, body, data } = request.body;
    
    const validationError = validateNotificationPayload(request.body);
    if (validationError) {
        response.status(400).json({ error: validationError });
        return;
    }

    try {
        const devices = await getActiveDevicesFromUserDoc(fleet_id);
    
        if (!devices.length) {
            response.status(404).json({ error: "No active devices found for user" });
            return;
        }

        response.setHeader("Content-Type", "text/event-stream");
        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("Connection", "keep-alive");
        response.flushHeaders();

        const results = [];

        for (const device of devices) {
            const result = await sendPushToDevice(device, { fleet_id, task_ids, title, body, data });

            results.push(result);
            response.write(`data: ${JSON.stringify(result)}\n\n`);
        }

        response.write(`data: ${JSON.stringify({
            event: "complete",
            total: devices.length,
            sent: results.filter((r) => r.status === "sent").length,
            failed: results.filter((r) => r.status === "failed").length,
            skipped: results.filter((r) => r.status === "skipped").length,
        })}\n\n`);
        
        response.flush && response.flush(); 

        response.end();
    } catch (e) {
        if (response.headersSent) {
            response.write(`data: ${JSON.stringify({ event: "error", message: e.message })}\n\n`);
            response.end();
        } else {
            response.status(500).json({ error: e.message });
        }
    }
  }
);