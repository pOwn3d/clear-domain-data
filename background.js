const CLEAR_FUNCTIONS = {
  cache: "removeCache",
  cookies: "removeCookies",
  localStorage: "removeLocalStorage",
  indexedDB: "removeIndexedDB",
  serviceWorkers: "removeServiceWorkers",
  cacheStorage: "removeCacheStorage",
};

const VALID_TYPES = new Set(Object.keys(CLEAR_FUNCTIONS));
const DOMAIN_REGEX = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

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

  const results = [];

  for (const type of types) {
    const fn = CLEAR_FUNCTIONS[type];
    try {
      await chrome.browsingData[fn]({ origins });
      results.push({ type, ok: true });
    } catch (e) {
      results.push({ type, ok: false, error: e.message });
    }
  }

  return results;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "clearDomain") {
    clearDomainData(msg.domain, msg.types, msg.includeHttp)
      .then(results => sendResponse({ results }))
      .catch(e => sendResponse({ results: [{ type: "global", ok: false, error: e.message }] }));
    return true;
  }
});
