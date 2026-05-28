/* eslint-disable */

const buildUpdateUserPatchV2 = (body) => {
  const patch = {};

  if (Object.prototype.hasOwnProperty.call(body, "phone_number") && body.phone_number != null) {
    patch.phone_number = String(body.phone_number).trim();
  }
  if (Object.prototype.hasOwnProperty.call(body, "display_name") && body.display_name != null) {
    patch.display_name = String(body.display_name);
  }
  if (Object.prototype.hasOwnProperty.call(body, "email")) {
    patch.email = body.email != null && body.email !== "" ? String(body.email).trim() : "";
  }
  if (Object.prototype.hasOwnProperty.call(body, "supplier_code")) {
    patch.supplier_code =
      body.supplier_code != null && body.supplier_code !== ""
        ? String(body.supplier_code).trim()
        : null;
  }
  if (Object.prototype.hasOwnProperty.call(body, "role")) {
    patch.role = body.role != null && body.role !== "" ? String(body.role) : null;
  }
  if (Object.prototype.hasOwnProperty.call(body, "vehicle_number")) {
    patch.vehicle_number =
      body.vehicle_number != null && body.vehicle_number !== ""
        ? String(body.vehicle_number)
        : null;
  }
  if (Object.prototype.hasOwnProperty.call(body, "is_freelancer")) {
    patch.is_freelancer = body.is_freelancer === true;
  }

  return patch;
};

module.exports = { buildUpdateUserPatchV2 };
