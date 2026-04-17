/* eslint-disable */

const { onRequest } = require("firebase-functions/v2/https");
const { validateSecret } = require("../core/middleware/validate_secret");
const { validateCreateTaskBody } = require("../core/validators/create_task_payload_validators");
const { buildCreateTaskDoc } = require("../core/builders/create_task_doc_builder");
const { createTaskInFirestore, getUserByFleetId } = require("../core/services/firestore_service");
const { buildTrackingLink } = require("../core/utils/tracking_link");

exports.createTaskService = onRequest(
  async (request, response) => {
    if (!validateSecret(request, response)) return;

    if (request.method !== "POST") {
      response.status(405).json({ error: "Method not allowed" });
      return;
    }

    const body = request.body || {};
    const errors = validateCreateTaskBody(body);

    if (errors.length > 0) {
      response.status(400).json({ errors });
      return;
    }

    const fleet_id = Number(body.fleet_id);
    let fleetUser;
    try {
      fleetUser = await getUserByFleetId(fleet_id);
      if (!fleetUser) {
        response.status(404).json({ error: "No user found for this fleet_id" });
        return;
      }
    } catch (e) {
      response.status(500).json({ error: e.message });
      return;
    }

    const { doc } = buildCreateTaskDoc(body);
    if (fleetUser.vehicle_number != null) {
      doc.vehicle_number = fleetUser.vehicle_number;
    }

    try {
      await createTaskInFirestore(doc.task_id, doc);
      response.status(200).json({
        task_id: doc.task_id,
        link_signature: doc.link_signature,
        tracking_link: buildTrackingLink(doc.link_signature),
        tracking_link_expires_at: doc.tracking_link_expires_at.toDate().toISOString(),
        success: true,
      });
    } catch (e) {
      response.status(500).json({ error: e.message });
    }
  }
);
