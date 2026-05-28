/* eslint-disable */

const { validateField } = require("./create_user_payload_validators_v2");

const LOOKUP_KEY = "driver_code";

const FORBIDDEN_CLIENT_KEYS = [
  "uid",
  "id",
  "created_at",
  "updated_at",
  "status",
  "password",
  "fleet_id",
  "supplier_id",
];

const UPDATE_SCHEMA = {
  driver_code: { type: "string", required: true },
  phone_number: { type: "phone", required: false },
  display_name: { type: "string", required: false },
  email: { type: "email", required: false },
  supplier_org_code: { type: "string", required: false },
  role: { type: "string", required: false },
  vehicle_number: { type: "string", required: false },
  is_freelancer: { type: "boolean", required: false },
};

const UPDATABLE_KEYS = Object.keys(UPDATE_SCHEMA).filter((k) => k !== LOOKUP_KEY);

const hasValueToApply = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === "string" && value.trim() === "") return false;
  return true;
};

const validateUpdateUserBodyV2 = (body) => {
  const forbidden = FORBIDDEN_CLIENT_KEYS.filter((k) =>
    Object.prototype.hasOwnProperty.call(body, k)
  );
  if (forbidden.length > 0) {
    return [`Must not send client-controlled fields: ${forbidden.join(", ")}`];
  }

  const errors = Object.entries(UPDATE_SCHEMA)
    .map(([key, rule]) => validateField(key, body[key], rule))
    .filter(Boolean);

  const hasPatchField = UPDATABLE_KEYS.some((k) => hasValueToApply(body[k]));
  if (!hasPatchField) {
    errors.push("At least one field to update is required besides driver_code");
  }

  return errors;
};

module.exports = { validateUpdateUserBodyV2, LOOKUP_KEY, UPDATABLE_KEYS };
