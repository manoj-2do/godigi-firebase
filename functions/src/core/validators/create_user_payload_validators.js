/* eslint-disable */

const SCHEMA = {
  email: { type: "email", required: true },
  password: { type: "string", required: true, minLength: 6 },
  display_name: { type: "string", required: false },
  phone_number: { type: "string", required: false },
  fleet_id: { type: "int", required: false },
  supplier_id: { type: "stringLike", required: false },
  role: { type: "string", required: false },
  vehicle_number: { type: "string", required: false },
};

const validateField = (key, value, rule) => {
  const empty = value === undefined || value === null || value === "";
  if (empty && value !== 0) {
    if (rule.required) return `${key} is required`;
    return null;
  }

  switch (rule.type) {
    case "string":
      if (typeof value !== "string") return `${key} must be a string`;
      if (rule.minLength != null && value.length < rule.minLength) {
        return `${key} must be at least ${rule.minLength} characters`;
      }
      break;
    case "stringLike":
      if (typeof value !== "string" && typeof value !== "number") {
        return `${key} must be a string or number`;
      }
      break;
    case "email":
      if (typeof value !== "string") return `${key} must be a string`;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return `${key} must be a valid email`;
      break;
    case "int": {
      const parsed = Number(value);
      if (!Number.isInteger(parsed)) return `${key} must be an integer`;
      break;
    }
  }

  return null;
};

const validateCreateUserBody = (body) => {
  return Object.entries(SCHEMA)
    .map(([key, rule]) => validateField(key, body[key], rule))
    .filter(Boolean);
};

module.exports = { validateCreateUserBody };
