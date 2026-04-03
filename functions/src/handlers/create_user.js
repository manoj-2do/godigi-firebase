/* eslint-disable */

const { onRequest } = require("firebase-functions/v2/https");
const { validateSecret } = require("../core/middleware/validate_secret");
const { validateCreateUserBody } = require("../core/validators/user_validators");
const { createAuthUser, setCustomClaims, deleteAuthUser } = require("../core/services/auth_service");
const { createUserInFirestore } = require("../core/services/firestore_service");
const { logAudit } = require("../core/services/audit_service");
const config = require("../core/config");

exports.createUserService = onRequest(
  async (request, response) => {
    if (!validateSecret(request, response)) return;
    if (!validateCreateUserBody(request.body, response)) return;

    const { email, password, display_name, phone_number, fleet_id, supplier_id } = request.body;

    let userRecord;

    try {
      userRecord = await createAuthUser({ email, password, display_name });
      
      // if (fleet_id) {
      //   await setCustomClaims(userRecord.uid, { fleet_id: fleet_id });
      // }

      await createUserInFirestore(userRecord.uid, { email, display_name, phone_number, fleet_id, supplier_id });

      response.status(200).json({
        uid: userRecord.uid,
        email: userRecord.email,
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      if (userRecord) await deleteAuthUser(userRecord.uid);
      response.status(500).json({ error: e.message });
    }
  }
);