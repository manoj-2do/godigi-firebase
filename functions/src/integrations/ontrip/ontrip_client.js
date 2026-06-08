/* eslint-disable */

const config = require("../../core/config");
const { requestJson } = require("../http/http_client");
const { apiKeyHeaders } = require("../http/api_key_auth");

/**
 * PATCH Ontrip booking component tracking flag.
 * @param {{ booking_code: string, component_code: string | number, is_tracking_link_enabled?: boolean }} params
 */
async function enableTrackingLinkOnBooking({ booking_code, component_code, is_tracking_link_enabled = true }) {
  const baseUrl = config.ontrip.baseUrl;
  const apiSecret = config.ontrip.apiSecret;
  if (!baseUrl || !apiSecret) {
    const err = new Error("Ontrip integration is not configured (ONTRIP_API_BASE_URL / ONTRIP_API_SECRET)");
    err.code = "ONTRIP_NOT_CONFIGURED";
    throw err;
  }

  const code = encodeURIComponent(String(booking_code).trim());
  const url = `${baseUrl.replace(/\/$/, "")}/addBookingGodigiComponents/bookings/${code}`;

  const parsedComponent = Number(component_code);
  const componentPayload = Number.isFinite(parsedComponent) ? parsedComponent : component_code;

  return requestJson({
    method: "PATCH",
    url,
    headers: {
      "Content-Type": "application/json",
      ...apiKeyHeaders({ headerName: config.secretHeader, apiKey: apiSecret }),
    },
    body: [{ component_code: componentPayload, is_tracking_link_enabled: !!is_tracking_link_enabled }],
  });
}

module.exports = { enableTrackingLinkOnBooking };
