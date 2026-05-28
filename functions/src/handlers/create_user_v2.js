/* eslint-disable */

const { onRequest } = require("firebase-functions/v2/https");
const { validateSecret } = require("../core/middleware/validate_secret");
const { validateCreateUserBodyV2 } = require("../core/validators/create_user_payload_validators_v2");
const { buildCreateUserDocV2 } = require("../core/builders/create_user_doc_builder_v2");
const { createAuthUserWithPhone, getUserByPhoneNumber, deleteAuthUser } = require("../core/services/auth_service");
const {
  createUserInFirestore,
  supplierExistsByOrgCode,
} = require("../core/services/firestore_service");

exports.createUserServiceV2 = onRequest(
  async (request, response) => {
    if (!validateSecret(request, response)) return;

    if (request.method !== "POST") {
      response.status(405).json({ error: "Method not allowed" });
      return;
    }

    const body = request.body || {};
    const errors = validateCreateUserBodyV2(body);

    if (errors.length > 0) {
      response.status(400).json({ errors });
      return;
    }

    const { auth, doc } = buildCreateUserDocV2(body);

    if (doc.supplier_org_code) {
      const supplierFound = await supplierExistsByOrgCode(doc.supplier_org_code);
      if (!supplierFound) {
        response.status(404).json({
          error: `Supplier not found for supplier_org_code: ${body.supplier_org_code}`,
        });
        return;
      }
    }

    let userRecord;

    try {
      const existing = await getUserByPhoneNumber(auth.phone_number);
      if (existing) {
        response.status(409).json({ error: "User already exists" });
        return;
      }

      userRecord = await createAuthUserWithPhone(auth);
      if (!userRecord || !userRecord.uid) {
        response.status(500).json({ error: "Failed to create user" });
        return;
      }

      await createUserInFirestore(userRecord.uid, doc);

      response.status(200).json({
        uid: userRecord.uid,
        phone_number: userRecord.phoneNumber,
        driver_code: doc.driver_code,
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      if (e.code === "auth/phone-number-already-exists") {
        response.status(409).json({ error: "User already exists" });
        return;
      }
      if (e.code === "auth/user-creation-failed") {
        response.status(500).json({ error: "Failed to create user" });
        return;
      }
      if (userRecord && userRecord.uid) await deleteAuthUser(userRecord.uid);
      response.status(500).json({ error: e.message || "Failed to create user" });
    }
  }
);
