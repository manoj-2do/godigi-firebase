/* eslint-disable */

const { onRequest } = require("firebase-functions/v2/https");
const { validateSecret } = require("../core/middleware/validate_secret");
const { validateCreateSupplierBody } = require("../core/validators/create_supplier_payload_validators");
const { buildCreateSupplierDoc } = require("../core/builders/create_supplier_doc_builder");
const { createSupplierInFirestore } = require("../core/services/firestore_service");

exports.createSupplier = onRequest(async (request, response) => {
  if (!validateSecret(request, response)) return;

  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = request.body || {};
  const errors = validateCreateSupplierBody(body);

  if (errors.length > 0) {
    response.status(400).json({ errors });
    return;
  }

  const { doc } = buildCreateSupplierDoc(body);

  try {
    await createSupplierInFirestore(doc.supplier_id, doc);
    response.status(200).json({
      supplier_id: doc.supplier_id,
      name: doc.name,
      success: true,
    });
  } catch (e) {
    if (e.code === "SUPPLIER_ID_ALREADY_EXISTS") {
      response.status(409).json({ error: e.message });
      return;
    }
    response.status(500).json({ error: e.message });
  }
});
