/* eslint-disable */

const { onRequest } = require("firebase-functions/v2/https");
const { validateSecret } = require("../core/middleware/validate_secret");
const {
  validateUpdateUserBodyV2,
  LOOKUP_KEY,
} = require("../core/validators/update_user_payload_validators_v2");
const { buildUpdateUserPatchV2 } = require("../core/builders/update_user_patch_builder_v2");
const { updateAuthUser } = require("../core/services/auth_service");
const {
  getUserByDriverCode,
  updateUserInFirestore,
  supplierExistsByOrgCode,
} = require("../core/services/firestore_service");

exports.updateUserServiceV2 = onRequest(async (request, response) => {
  if (!validateSecret(request, response)) return;

  if (request.method !== "PATCH" && request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = request.body || {};
  const errors = validateUpdateUserBodyV2(body);

  if (errors.length > 0) {
    response.status(400).json({ errors });
    return;
  }

  const driver_code = String(body[LOOKUP_KEY]).trim();
  const patch = buildUpdateUserPatchV2(body);

  if (patch.supplier_org_code) {
    const supplierFound = await supplierExistsByOrgCode(patch.supplier_org_code);
    if (!supplierFound) {
      response.status(404).json({
        error: `Supplier not found for supplier_org_code: ${body.supplier_org_code}`,
      });
      return;
    }
  }

  try {
    const existing = await getUserByDriverCode(driver_code);
    if (!existing) {
      response.status(404).json({ error: "User not found" });
      return;
    }

    if (patch.phone_number || patch.display_name !== undefined) {
      await updateAuthUser(existing.uid, {
        phone_number: patch.phone_number,
        display_name: patch.display_name,
      });
    }

    await updateUserInFirestore(existing.uid, patch);

    response.status(200).json({
      driver_code,
      updated: Object.keys(patch),
      success: true,
    });
  } catch (e) {
    if (e.code === "auth/phone-number-already-exists") {
      response.status(409).json({ error: "Phone number already in use" });
      return;
    }
    response.status(500).json({ error: e.message || "Failed to update user" });
  }
});
