/* eslint-disable */

const config = require("../config");

const buildTrackingLink = (linkSignature) => {
  const base = config.trackingHostUrl && String(config.trackingHostUrl).replace(/\/$/, "");
  if (!base) return null;
  return `${base}/track/${encodeURIComponent(String(linkSignature))}`;
};

module.exports = { buildTrackingLink };
