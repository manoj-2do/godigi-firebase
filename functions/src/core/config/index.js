module.exports = {
  secretHeader: "x-api-secret",
  ANALYTICS_SECRET: process.env.ANALYTICS_SECRET,
  AES_SALT: process.env.AES_ENCRYPTION_256_SALT,
  /**
   * Base URL of Firebase Hosting (no trailing slash).
   * Set TRACKING_HOST_URL for a custom domain; otherwise defaults to https://<GCLOUD_PROJECT>.web.app
   */
  trackingHostUrl:
    process.env.TRACKING_HOST_URL ||
    (process.env.GCLOUD_PROJECT ? `https://${process.env.GCLOUD_PROJECT}.web.app` : undefined),
  collections: {
    users: "users",
    auditLogs: "audit_logs",
    supplierConfig: "supplier_config",
    suppliers: "suppliers",
    tripTracking: "trip_tracking",
    tasks: "tasks",
  },
};
