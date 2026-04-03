/* eslint-disable */

const admin = require("firebase-admin");
const { createUserService } = require("./src/handlers/create_user.js");
const { createSupplierConfigService } = require("./src/handlers/create_supplier_config.js");
const { createTripService } = require("./src/handlers/create_trip.js");
const { createTaskService } = require("./src/handlers/create_task.js");
const { sendNotificationToDriver } = require("./src/handlers/send_notification_to_driver.js");

admin.initializeApp();

exports.createUserService = createUserService;
exports.createSupplierConfigService = createSupplierConfigService;
exports.createTripService = createTripService;
exports.sendNotificationToDriver = sendNotificationToDriver;
exports.createTaskService = createTaskService;