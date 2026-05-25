/* eslint-disable */

const admin = require("firebase-admin");
const { createUserService } = require("./src/handlers/create_user.js");
const { createUserServiceV2 } = require("./src/handlers/create_user_v2.js");
const { updateUserServiceV2 } = require("./src/handlers/update_user_v2.js");
const { createSupplierConfigService } = require("./src/handlers/create_supplier_config.js");
const { createTripService } = require("./src/handlers/create_trip.js");
const { createTaskService } = require("./src/handlers/create_task.js");
const { createSupplier } = require("./src/handlers/create_supplier.js");
const { createSupplierV2 } = require("./src/handlers/create_supplier_v2.js");
const { updateSupplierV2 } = require("./src/handlers/update_supplier_v2.js");
const { sendNotificationToDriver } = require("./src/handlers/send_notification_to_driver.js");
const { getTrackingLink } = require("./src/handlers/get_tracking_link.js");

admin.initializeApp();

exports.createUserService = createUserService;
exports.createUserServiceV2 = createUserServiceV2;
exports.updateUserServiceV2 = updateUserServiceV2;
// exports.createSupplierConfigService = createSupplierConfigService; //INACTIVE
// exports.createTripService = createTripService; // INACTIVE
exports.sendNotificationToDriver = sendNotificationToDriver;
exports.createTaskService = createTaskService;
exports.createSupplier = createSupplier;
exports.createSupplierV2 = createSupplierV2;
exports.updateSupplierV2 = updateSupplierV2;
// exports.getTrackingLink = getTrackingLink;