/* eslint-disable */

const { onRequest } = require("firebase-functions/v2/https");
const { validateSecret } = require("../core/middleware/validate_secret");
const { validateCreateUserBody } = require("../core/validators/create_user_payload_validators");
const { buildCreateUserDoc } = require("../core/builders/create_user_doc_builder");
const { createAuthUser, getUserByEmail, deleteAuthUser } = require("../core/services/auth_service");
const { createUserInFirestore } = require("../core/services/firestore_service");

exports.createUserService = onRequest(
  async (request, response) => {
    if (!validateSecret(request, response)) return;

    if (request.method !== "POST") {
      response.status(405).json({ error: "Method not allowed" });
      return;
    }

    const body = request.body || {};
    const errors = validateCreateUserBody(body);

    if (errors.length > 0) {
      response.status(400).json({ errors });
      return;
    }

    const { auth, doc } = buildCreateUserDoc(body);

    let userRecord;

    try {
      const existing = await getUserByEmail(auth.email);
      if (existing) {
        response.status(409).json({ error: "User already exists" });
        return;
      }

      userRecord = await createAuthUser(auth);

      await createUserInFirestore(userRecord.uid, doc);

      response.status(200).json({
        uid: userRecord.uid,
        email: userRecord.email,
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      if (e.code === "auth/email-already-exists") {
        response.status(409).json({ error: "User already exists" });
        return;
      }
      if (userRecord) await deleteAuthUser(userRecord.uid);
      response.status(500).json({ error: e.message });
    }
  }
);
