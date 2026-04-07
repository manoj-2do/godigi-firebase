/* eslint-disable */

const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { validateSecret } = require("../core/middleware/validate_secret");
const config = require("../core/config");
const { buildTrackingLink } = require("../core/utils/tracking_link");

exports.getTrackingLink = onRequest(async (request, response) => {
  if (!validateSecret(request, response)) return;

  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = request.body || {};
  const booking_code = body.booking_code;
  const component_code = body.component_code;

  const errors = [];
  if (typeof booking_code !== "string" || !booking_code.trim()) {
    errors.push("booking_code must be a non-empty string");
  }
  if (typeof component_code !== "string" || !component_code.trim()) {
    errors.push("component_code must be a non-empty string");
  }
  if (errors.length > 0) {
    response.status(400).json({ errors });
    return;
  }

  try {
    const snapshot = await admin
      .firestore()
      .collection(config.collections.tasks)
      .where("booking_code", "==", booking_code.trim())
      .where("component_code", "==", component_code.trim())
      .limit(1)
      .get();

    if (snapshot.empty) {
      response.status(200).json({ url: null });
      return;
    }

    const data = snapshot.docs[0].data();
    const linkSignature = data.link_signature != null ? data.link_signature : data.token;
    if (linkSignature == null || String(linkSignature).trim() === "") {
      response.status(200).json({ url: null });
      return;
    }

    const url = buildTrackingLink(linkSignature);
    response.status(200).json({ url: url == null ? null : url });
  } catch (e) {
    response.status(500).json({ error: e.message });
  }
});
