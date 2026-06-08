module.exports = {
  secretHeader: "x-api-secret",
  ANALYTICS_SECRET: process.env.ANALYTICS_SECRET,
  AES_SALT: process.env.AES_ENCRYPTION_256_SALT,

  trackingHostUrl:
    process.env.TRACKING_HOST_URL ||
    (process.env.GCLOUD_PROJECT ? `https://${process.env.GCLOUD_PROJECT}.web.app` : undefined),
  ontrip: {
    baseUrl: process.env.ONTRIP_API_BASE_URL,
    apiSecret: process.env.ONTRIP_API_SECRET,
  },
  collections: {
    users: "users",
    auditLogs: "audit_logs",
    supplierConfig: "supplier_config",
    suppliers: "suppliers",
    tripTracking: "trip_tracking",
    tasks: "tasks",
    trackingLinks: "tracking_links",
  },
};
