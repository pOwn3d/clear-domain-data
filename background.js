const CLEAR_FUNCTIONS = {
  cache: "removeCache",
  cookies: "removeCookies",
  localStorage: "removeLocalStorage",
  indexedDB: "removeIndexedDB",
  serviceWorkers: "removeServiceWorkers",
  cacheStorage: "removeCacheStorage",
};

const VALID_TYPES = new Set(Object.keys(CLEAR_FUNCTIONS));

// Supports standard domains, localhost, and IP addresses
const DOMAIN_REGEX = /^(localhost|(\d{1,3}\.){3}\d{1,3}|([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,})$/;

function validateDomain(domain) {
  if (typeof domain !== "string" || domain.length === 0 || domain.length > 253) return false;
  return DOMAIN_REGEX.test(domain);
}

function validateTypes(types) {
  return Array.isArray(types) && types.length > 0 && types.every(t => VALID_TYPES.has(t));
}

async function clearDomainData(domain, types, includeHttp) {
  if (!validateDomain(domain)) throw new Error("Invalid domain");
  if (!validateTypes(types)) throw new Error("Invalid data types");

  const origins = [`https://${domain}`];
  if (includeHttp) origins.push(`http://${domain}`);

  const promises = types.map(async (type) => {
    const fn = CLEAR_FUNCTIONS[type];
    try {
      await chrome.browsingData[fn]({ origins });
      return { type, ok: true };
    } catch (e) {
      return { type, ok: false, error: e.message };
    }
  });

  return Promise.all(promises);
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "clearDomain") {
    clearDomainData(msg.domain, msg.types, msg.includeHttp)
      .then(results => sendResponse({ results }))
      .catch(e => sendResponse({ results: [{ type: "global", ok: false, error: e.message }] }));
    return true;
  }
});
