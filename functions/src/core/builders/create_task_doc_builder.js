/* eslint-disable */

const { randomUUID } = require("crypto");
const { Timestamp } = require("firebase-admin/firestore");

const THIRTY_TWO_HOURS_MS = 32 * 60 * 60 * 1000;

const buildCreateTaskDoc = (body) => {
  const pickupMs = Date.parse(body.pick_up_time);
  const token = randomUUID();
  const token_expires_at = Timestamp.fromMillis(pickupMs + THIRTY_TWO_HOURS_MS);

  return {
    doc: {
      task_id:             Number(body.task_id),
      task_status:         Number(body.task_status),
      booking_code:        String(body.booking_code),
      component_code:      String(body.component_code),
      requirement_code:    String(body.requirement_code),
      driver_name:         String(body.driver_name),
      driver_phone_number: String(body.driver_phone_number),
      fleet_id:            Number(body.fleet_id),
      guest_name:          String(body.guest_name),
      guest_phone_number:  String(body.guest_phone_number),
      is_tracking_active:  false,
      pick_up:             String(body.pick_up),
      pick_up_time:        String(body.pick_up_time),
      pickup_lat:          parseFloat(body.pickup_lat),
      pickup_lng:          parseFloat(body.pickup_lng),
      drop_at:             String(body.drop_at),
      token,
      token_expires_at,
    },
  };
};

module.exports = { buildCreateTaskDoc };