/* eslint-disable */

const { onRequest } = require("firebase-functions/v2/https");
const { validateSecret } = require("../core/middleware/validate_secret");
const { logAudit } = require("../core/services/audit_service");
const { encryptAES256ECB } = require("../core/services/encryption_service");
const { createSupplierConfigInFirestore } = require("../core/services/firestore_service");
const config = require("../core/config");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");

exports.createSupplierConfigService = onRequest(
  { },
  async (request, response) => {
    if (!validateSecret(request, response)) return;

    const { supplier_id, api_key, name } = request.body;

    if (!supplier_id || !api_key) {
      response.status(400).json({ error: "supplier_id and key are required" });
      return;
    }

    try {
      const encrypted_key = encryptAES256ECB(api_key, config.AES_SALT);

      await createSupplierConfigInFirestore(supplier_id, encrypted_key, name);

      response.status(200).json({
        supplier_id,
        key: encrypted_key,
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      response.status(500).json({ error: e.message });
    }
  }
);