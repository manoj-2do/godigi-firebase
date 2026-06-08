/* eslint-disable */

/**
 * @param {{ apiKey: string, headerName?: string }} opts
 * @returns {Record<string, string>}
 */
function apiKeyHeaders({ apiKey, headerName = "x-api-secret" }) {
  if (!apiKey) return {};
  return { [headerName]: apiKey };
}

module.exports = { apiKeyHeaders };
