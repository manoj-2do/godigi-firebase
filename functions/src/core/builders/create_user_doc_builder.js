/* eslint-disable */
const buildCreateUserDoc = (body) => {
  const email = String(body.email).trim();
  const password = String(body.password);

  const doc = {
    email,
    display_name: body.display_name != null ? String(body.display_name) : "",
    phone_number: body.phone_number != null ? String(body.phone_number) : "",
    fleet_id: body.fleet_id != null && body.fleet_id !== "" ? Number(body.fleet_id) : null,
    supplier_id:
      body.supplier_id != null && body.supplier_id !== "" ? String(body.supplier_id).trim() : null,
    role: body.role != null && body.role !== "" ? String(body.role) : null,
    vehicle_number: body.vehicle_number != null && body.vehicle_number !== "" ? String(body.vehicle_number) : null,
  };

  return {
    auth: {
      email,
      password,
      display_name: doc.display_name,
    },
    doc,
  };
};

module.exports = { buildCreateUserDoc };
