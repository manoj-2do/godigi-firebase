/* eslint-disable */

const { onRequest } = require("firebase-functions/v2/https");
const { validateSecret } = require("../core/middleware/validate_secret");
const { validateCreateSupplierBodyV2 } = require("../core/validators/create_supplier_payload_validators_v2");
const { buildCreateSupplierDocV2 } = require("../core/builders/create_supplier_doc_builder_v2");
const { createSupplierInFirestoreV2 } = require("../core/services/firestore_service");

exports.createSupplierV2 = onRequest(async (request, response) => {
  if (!validateSecret(request, response)) return;

  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = request.body || {};
  const errors = validateCreateSupplierBodyV2(body);

  if (errors.length > 0) {
    response.status(400).json({ errors });
    return;
  }

  const { supplier_org_code, doc } = buildCreateSupplierDocV2(body);

  try {
    await createSupplierInFirestoreV2(supplier_org_code, doc);
    response.status(200).json({
      supplier_org_code: doc.supplier_org_code,
      supplier_member_code: doc.supplier_member_code,
      supplier_name: doc.supplier_name,
      success: true,
    });
  } catch (e) {
    if (e.code === "SUPPLIER_ORG_CODE_ALREADY_EXISTS") {
      response.status(409).json({ error: e.message });
      return;
    }
    response.status(500).json({ error: e.message });
  }
});
