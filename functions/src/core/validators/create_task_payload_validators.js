/* eslint-disable */

const SCHEMA = {
  task_id:             { type: "int",  required: true },
  task_status:         { type: "intRange", required: true, min: 0, max: 5 },
  booking_code:        { type: "string",  required: true },
  component_code:      { type: "string",  required: true },
  requirement_code:    { type: "string",  required: true },
  fleet_id:            { type: "int",  required: true },
  driver_name:         { type: "string",  required: true },
  driver_phone_number: { type: "string",  required: false },
  guest_name:          { type: "string",  required: true },
  guest_phone_number:  { type: "string",  required: true },
  pick_up:             { type: "string",  required: true },
  pick_up_time:        { type: "isoDate", required: true },
  pickup_lat:          { type: "number",  required: true },
  pickup_lng:          { type: "number",  required: true },
  drop_at:             { type: "string",  required: true },
};

const validateField = (key, value, rule) => {
  if (!value && value !== 0) {
    if (rule.required) return `${key} is required`;
    return null;
  }

  switch (rule.type) {
    case "string":
      if (typeof value !== "string") return `${key} must be a string`;
      break;
    case "number":
      if (Number.isNaN(typeof value === "number" ? value : parseFloat(value)))
        return `${key} must be a valid number`;
      break;
    case "isoDate":
      if (typeof value !== "string") return `${key} must be a string`;
      if (Number.isNaN(Date.parse(value))) return `${key} must be a valid ISO date string`;
      break;
    case "int":
      const parsedInt = Number(value);
      if (!Number.isInteger(parsedInt)) return `${key} must be an integer`;
      break;
    case "intRange":
      const parsedIntRange = Number(value);
      if (!Number.isInteger(parsedIntRange) || parsedIntRange < rule.min || parsedIntRange > rule.max)
        return `${key} must be an integer between ${rule.min} and ${rule.max}`;
      break;
  }

  return null;
};

const FORBIDDEN_CLIENT_KEYS = [
  "token",
  "tracking_token",
  "token_expires_at",
  "tokenExpiresAt",
  "link_signature",
  "linkSignature",
  "tracking_link_expires_at",
  "trackingLinkExpiresAt",
];

const validateCreateTaskBody = (body) => {
  const forbidden = FORBIDDEN_CLIENT_KEYS.filter((k) => Object.prototype.hasOwnProperty.call(body, k));
  if (forbidden.length > 0) {
    return [`Must not send client-controlled fields: ${forbidden.join(", ")}`];
  }
  return Object.entries(SCHEMA)
    .map(([key, rule]) => validateField(key, body[key], rule))
    .filter(Boolean);
};

module.exports = { validateCreateTaskBody };