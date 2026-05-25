/* eslint-disable */

const { FieldValue } = require("firebase-admin/firestore");

const buildSupplierFieldsV2 = (body) => {
  const supplier_org_code = String(body.supplier_org_code).trim();
  const supplier_member_code = String(body.supplier_member_code).trim();
  const supplier_name = String(body.supplier_name).trim();

  return {
    supplier_org_code,
    supplier_member_code,
    supplier_name,
  };
};

const buildCreateSupplierDocV2 = (body) => {
  const fields = buildSupplierFieldsV2(body);

  return {
    supplier_org_code: fields.supplier_org_code,
    doc: {
      ...fields,
      created_at: FieldValue.serverTimestamp(),
    },
  };
};

const buildUpdateSupplierDocV2 = (body) => {
  const fields = buildSupplierFieldsV2(body);

  return {
    supplier_org_code: fields.supplier_org_code,
    doc: {
      ...fields,
      updated_at: FieldValue.serverTimestamp(),
    },
  };
};

module.exports = { buildCreateSupplierDocV2, buildUpdateSupplierDocV2 };
