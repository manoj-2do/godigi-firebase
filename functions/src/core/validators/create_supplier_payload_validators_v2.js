/* eslint-disable */

const SCHEMA = {
  supplier_org_code: { type: "string", required: true },
  supplier_member_code: { type: "string", required: true },
  supplier_name: { type: "string", required: true },
};

const LOOKUP_KEY = "supplier_org_code";

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
      break;
  }

  return null;
};

const FORBIDDEN_CLIENT_KEYS = [
  "supplier_id",
  "supplier_code",
  "supplier_org",
  "key",
  "api_key",
  "created_at",
  "updated_at",
];

const validateCreateSupplierBodyV2 = (body) => {
  const forbidden = FORBIDDEN_CLIENT_KEYS.filter((k) =>
    Object.prototype.hasOwnProperty.call(body, k)
  );
  if (forbidden.length > 0) {
    return [`Must not send client-controlled fields: ${forbidden.join(", ")}`];
  }

  return Object.entries(SCHEMA)
    .map(([key, rule]) => validateField(key, body[key], rule))
    .filter(Boolean);
};

/** Update uses the same required fields as create. */
const validateUpdateSupplierBodyV2 = validateCreateSupplierBodyV2;

module.exports = {
  validateCreateSupplierBodyV2,
  validateUpdateSupplierBodyV2,
  LOOKUP_KEY,
};
