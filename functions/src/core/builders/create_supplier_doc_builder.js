/* eslint-disable */

const { FieldValue } = require("firebase-admin/firestore");

const buildCreateSupplierDoc = (body) => {
  const supplier_id = Number(body.supplier_id);
  const name = String(body.name).trim();

  return {
    doc: {
      supplier_id,
      name,
      created_at: FieldValue.serverTimestamp(),
    },
  };
};

module.exports = { buildCreateSupplierDoc };
