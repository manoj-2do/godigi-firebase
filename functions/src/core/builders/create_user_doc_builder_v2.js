/* eslint-disable */

const buildCreateUserDocV2 = (body) => {
  const phone_number = String(body.phone_number).trim();

  const doc = {
    phone_number,
    driver_code: String(body.driver_code).trim(),
    display_name: body.display_name != null ? String(body.display_name) : "",
    email: body.email != null && body.email !== "" ? String(body.email).trim() : "",
    supplier_code: body.supplier_code != null && body.supplier_code !== "" ? String(body.supplier_code).trim() : null,
    role: body.role != null && body.role !== "" ? String(body.role) : null,
    vehicle_number: body.vehicle_number != null && body.vehicle_number !== "" ? String(body.vehicle_number) : null,
    is_freelancer: typeof body.is_freelancer === "boolean" ? body.is_freelancer : false,
  };

  return {
    auth: {
      phone_number,
      display_name: doc.display_name,
    },
    doc,
  };
};

module.exports = { buildCreateUserDocV2 };
