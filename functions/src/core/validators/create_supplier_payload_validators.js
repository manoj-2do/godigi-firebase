/* eslint-disable */

const SCHEMA = {
  supplier_id: { type: "int", required: true },
  name: { type: "string", required: true },
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
      break;
    case "int": {
      const parsedInt = Number(value);
      if (!Number.isInteger(parsedInt)) return `${key} must be an integer`;
      break;
    }
  }

  return null;
};

const FORBIDDEN_CLIENT_KEYS = ["key", "api_key", "created_at"];

const validateCreateSupplierBody = (body) => {
  const forbidden = FORBIDDEN_CLIENT_KEYS.filter((k) =>
    Object.prototype.hasOwnProperty.call(body, k)
  );
  if (forbidden.length > 0) {
    return [`Must not send client-controlled fields: ${forbidden.join(", ")}`];
  }
  const errors = Object.entries(SCHEMA)
    .map(([key, rule]) => validateField(key, body[key], rule))
    .filter(Boolean);
  if (errors.length > 0) return errors;

  const nameTrim = body.name != null ? String(body.name).trim() : "";
  if (!nameTrim) errors.push("name must not be empty");
  return errors;
};

module.exports = { validateCreateSupplierBody };
