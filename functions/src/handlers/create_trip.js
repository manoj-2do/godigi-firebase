/* eslint-disable */

const { randomUUID } = require("crypto");
const { onRequest } = require("firebase-functions/v2/https");
const { validateSecret } = require("../core/middleware/validate_secret");
const { createTripTrackingInFirestore } = require("../core/services/firestore_service");
const config = require("../core/config");
const { FieldValue, Timestamp } = require("firebase-admin/firestore");

const buildTrackingLink = (jobId, token) => {
  const base = config.trackingHostUrl && String(config.trackingHostUrl).replace(/\/$/, "");
  if (!base) return null;
  return `${base}/track/${encodeURIComponent(jobId)}/${encodeURIComponent(token)}`;
};

exports.createTripService = onRequest(
  async (request, response) => {
    if (!validateSecret(request, response)) return;

    if (request.method !== "POST") {
      response.status(405).json({ error: "Method not allowed" });
      return;
    }

    const body = request.body || {};
    const {
      job_id,
      booking_code,
      fleet_id,
      guest_name,
      is_tracking_active,
      pick_up,
      pick_up_time,
      pickup_lat,
      pickup_lng,
      requirement_code,
      scheduled_time,
      status,
      driver_name,
      driver_phone_number,
    } = body;

    if (!job_id || typeof job_id !== "string") {
      response.status(400).json({ error: "job_id is required (string)" });
      return;
    }
    if (!pick_up_time || typeof pick_up_time !== "string") {
      response.status(400).json({ error: "pick_up_time is required (string ISO)" });
      return;
    }

    const pickupMs = Date.parse(pick_up_time);
    if (Number.isNaN(pickupMs)) {
      response.status(400).json({ error: "pick_up_time must be a valid ISO date string" });
      return;
    }

    let scheduledTimestamp;
    if (scheduled_time != null && scheduled_time !== "") {
      const st =
        typeof scheduled_time === "string"
          ? Date.parse(scheduled_time)
          : scheduled_time instanceof Date
            ? scheduled_time.getTime()
            : null;
      if (st == null || Number.isNaN(st)) {
        response.status(400).json({ error: "scheduled_time must be a valid ISO string or Date" });
        return;
      }
      scheduledTimestamp = Timestamp.fromMillis(st);
    } else {
      scheduledTimestamp = Timestamp.fromMillis(pickupMs);
    }

    const token_expires_at = Timestamp.fromMillis(pickupMs + 30 * 60 * 60 * 1000);
    const token = randomUUID();

    const doc = {
      booking_code: booking_code != null ? String(booking_code) : "",
      driver_name: driver_name != null ? String(driver_name) : "",
      driver_phone_number: driver_phone_number != null ? String(driver_phone_number) : "",
      fleet_id: fleet_id != null ? String(fleet_id) : "",
      guest_name: guest_name != null ? String(guest_name) : "",
      is_tracking_active: Boolean(is_tracking_active),
      job_id: String(job_id),
      last_updated_at: FieldValue.serverTimestamp(),
      pick_up: pick_up != null ? String(pick_up) : "",
      pick_up_time: String(pick_up_time),
      pickup_lat: typeof pickup_lat === "number" ? pickup_lat : parseFloat(pickup_lat),
      pickup_lng: typeof pickup_lng === "number" ? pickup_lng : parseFloat(pickup_lng),
      requirement_code: requirement_code != null ? String(requirement_code) : "",
      scheduled_time: scheduledTimestamp,
      status: status != null ? String(status) : "assigned",
      token,
      token_expires_at,
    };

    if (Number.isNaN(doc.pickup_lat) || Number.isNaN(doc.pickup_lng)) {
      response.status(400).json({ error: "pickup_lat and pickup_lng must be valid numbers" });
      return;
    }

    try {
      await createTripTrackingInFirestore(job_id, doc);
      response.status(200).json({
        job_id,
        token,
        tracking_link: buildTrackingLink(job_id, token),
        success: true,
      });
    } catch (e) {
      response.status(500).json({ error: e.message });
    }
  }
);
