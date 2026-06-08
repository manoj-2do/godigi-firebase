/* eslint-disable */

const DEFAULT_TIMEOUT_MS = 10000;

class IntegrationError extends Error {
  /**
   * @param {string} message
   * @param {{ status?: number, body?: unknown }} [opts]
   */
  constructor(message, opts = {}) {
    super(message);
    this.name = "IntegrationError";
    this.status = opts.status;
    this.body = opts.body;
  }
}

/**
 * @param {{ method?: string, url: string, headers?: Record<string, string>, body?: unknown, timeoutMs?: number }} opts
 * @returns {Promise<unknown>}
 */
async function requestJson(opts) {
  const {
    method = "GET",
    url,
    headers = {},
    body,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = opts;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const init = {
    method,
    headers: { ...headers },
    signal: controller.signal,
  };

  if (body !== undefined) {
    init.headers["Content-Type"] = init.headers["Content-Type"] || "application/json";
    init.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(url, init);
    const text = await res.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        data = text;
      }
    }

    if (!res.ok) {
      throw new IntegrationError(
        `HTTP ${res.status} ${method} ${url}`,
        { status: res.status, body: data },
      );
    }

    return data;
  } catch (err) {
    if (err.name === "AbortError") {
      throw new IntegrationError(`Request timed out after ${timeoutMs}ms: ${method} ${url}`);
    }
    if (err instanceof IntegrationError) throw err;
    throw new IntegrationError(err.message || `Request failed: ${method} ${url}`);
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { requestJson, IntegrationError, DEFAULT_TIMEOUT_MS };
