/* eslint-disable */

const { onRequest } = require("firebase-functions/v2/https");
const { validateSecret } = require("../core/middleware/validate_secret");
const { validateCreateTaskBody } = require("../core/validators/create_task_payload_validators");
const { buildCreateTaskDoc } = require("../core/builders/create_task_doc_builder");
const { createTaskInFirestore } = require("../core/services/firestore_service");
const config = require("../core/config");

const buildTrackingLink = (taskId, token) => {
  const base = config.trackingHostUrl && String(config.trackingHostUrl).replace(/\/$/, "");
  if (!base) return null;
  return `${base}/track/${encodeURIComponent(String(taskId))}/${encodeURIComponent(token)}`;
};

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

    const { doc } = buildCreateTaskDoc(body);

    try {
      await createTaskInFirestore(doc.task_id, doc);
      response.status(200).json({
        task_id: doc.task_id,
        token: doc.token,
        tracking_link: buildTrackingLink(doc.task_id, doc.token),
        token_expires_at: doc.token_expires_at.toDate().toISOString(),
        success: true,
      });
    } catch (e) {
      if (e.code === "TASK_ID_ALREADY_EXISTS") {
        response.status(409).json({ error: e.message });
        return;
      }
      response.status(500).json({ error: e.message });
    }
  }
);
