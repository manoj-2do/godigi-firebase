/* eslint-disable */

const E164_PHONE = /^\+[1-9]\d{7,14}$/;

const SCHEMA = {
  phone_number: { type: "phone", required: true },
  driver_code: { type: "string", required: true },
  display_name: { type: "string", required: false },
  email: { type: "email", required: false },
  supplier_code: { type: "string", required: false },
  role: { type: "string", required: false },
  vehicle_number: { type: "string", required: false },
  is_freelancer: { type: "boolean", required: false },
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
      if (rule.required && value.trim() === "") return `${key} must not be empty`;
      if (rule.minLength != null && value.length < rule.minLength) {
        return `${key} must be at least ${rule.minLength} characters`;
      }
      break;
    case "email":
      if (typeof value !== "string") return `${key} must be a string`;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return `${key} must be a valid email`;
      break;
    case "phone":
      if (typeof value !== "string") return `${key} must be a string`;
      if (!E164_PHONE.test(value.trim())) {
        return `${key} must be E.164 format (e.g. +919876543210)`;
      }
      break;
    case "boolean":
      if (typeof value !== "boolean") return `${key} must be a boolean`;
      break;
  }

  return null;
};

const validateCreateUserBodyV2 = (body) => {
  return Object.entries(SCHEMA)
    .map(([key, rule]) => validateField(key, body[key], rule))
    .filter(Boolean);
};

module.exports = { validateCreateUserBodyV2, validateField, E164_PHONE };
