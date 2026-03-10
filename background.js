const CLEAR_FUNCTIONS = {
  cache: "removeCache",
  cookies: "removeCookies",
  localStorage: "removeLocalStorage",
  indexedDB: "removeIndexedDB",
  serviceWorkers: "removeServiceWorkers",
  cacheStorage: "removeCacheStorage",
};

const VALID_TYPES = new Set(Object.keys(CLEAR_FUNCTIONS));
const ALL_TYPES = Object.keys(CLEAR_FUNCTIONS);
const STORAGE_KEY = "clearDomainPrefs";

// Supports standard domains, localhost, IPs, and optional port
const DOMAIN_REGEX = /^(localhost|(\d{1,3}\.){3}\d{1,3}|([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,})(:\d{1,5})?$/;

function validateDomain(domain) {
  if (typeof domain !== "string" || domain.length === 0 || domain.length > 260) return false;
  return DOMAIN_REGEX.test(domain);
}

function validateTypes(types) {
  return Array.isArray(types) && types.length > 0 && types.every(t => VALID_TYPES.has(t));
}

async function clearDomainData(domain, types, includeHttp, includeSubdomains) {
  if (!validateDomain(domain)) throw new Error("Invalid domain");
  if (!validateTypes(types)) throw new Error("Invalid data types");

  const origins = [`https://${domain}`];
  if (includeHttp) origins.push(`http://${domain}`);

  // Clear exact domain
  const results = await Promise.all(types.map(async (type) => {
    const fn = CLEAR_FUNCTIONS[type];
    try {
      await chrome.browsingData[fn]({ origins });
      return { type, ok: true };
    } catch (e) {
      return { type, ok: false, error: e.message };
    }
  }));

  // Clear subdomain cookies if requested
  if (includeSubdomains) {
    const baseDomain = domain.replace(/:\d+$/, "");
    const subResults = await Promise.all(types.map(async (type) => {
      try {
        if (type === "cookies") {
          const cookies = await chrome.cookies.getAll({ domain: baseDomain });
          await Promise.all(cookies.map(c => {
            const protocol = c.secure ? "https:" : "http:";
            const host = c.domain.startsWith(".") ? c.domain.slice(1) : c.domain;
            return chrome.cookies.remove({ url: `${protocol}//${host}${c.path}`, name: c.name });
          }));
        }
        return null;
      } catch (e) {
        return { type: `${type} (subdomains)`, ok: false, error: e.message };
      }
    }));
    subResults.filter(Boolean).forEach(r => results.push(r));
  }

  return results;
}

// Context menu: right-click "Clear data for this domain"
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "clearDomainCtx",
    title: "Clear data for this domain",
    contexts: ["page"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "clearDomainCtx" || !tab?.url) return;
  try {
    const url = new URL(tab.url);
    const domain = url.host;
    if (!validateDomain(domain)) return;

    const stored = await chrome.storage.local.get(STORAGE_KEY);
    const prefs = stored[STORAGE_KEY] || {};
    const types = prefs.types || ALL_TYPES;
    const includeHttp = prefs.includeHttp || false;
    const includeSubdomains = prefs.includeSubdomains || false;

    const results = await clearDomainData(domain, types, includeHttp, includeSubdomains);
    const allOk = results.every(r => r.ok);

    // Show badge feedback
    chrome.action.setBadgeText({ text: allOk ? "✓" : "✗", tabId: tab.id });
    chrome.action.setBadgeBackgroundColor({ color: allOk ? "#2e7d32" : "#c62828", tabId: tab.id });
    setTimeout(() => chrome.action.setBadgeText({ text: "", tabId: tab.id }), 2000);

    if (allOk && (prefs.autoReload !== false)) {
      chrome.tabs.reload(tab.id);
    }
  } catch (_) {}
});

// Keyboard shortcut: clear current domain
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "clear-current-domain") return;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return;
    const url = new URL(tab.url);
    const domain = url.host;
    if (!validateDomain(domain)) return;

    const stored = await chrome.storage.local.get(STORAGE_KEY);
    const prefs = stored[STORAGE_KEY] || {};
    const types = prefs.types || ALL_TYPES;
    const includeHttp = prefs.includeHttp || false;
    const includeSubdomains = prefs.includeSubdomains || false;

    const results = await clearDomainData(domain, types, includeHttp, includeSubdomains);
    const allOk = results.every(r => r.ok);

    chrome.action.setBadgeText({ text: allOk ? "✓" : "✗", tabId: tab.id });
    chrome.action.setBadgeBackgroundColor({ color: allOk ? "#2e7d32" : "#c62828", tabId: tab.id });
    setTimeout(() => chrome.action.setBadgeText({ text: "", tabId: tab.id }), 2000);

    if (allOk && (prefs.autoReload !== false)) {
      chrome.tabs.reload(tab.id);
    }
  } catch (_) {}
});

// Message handler from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "clearDomain") {
    clearDomainData(msg.domain, msg.types, msg.includeHttp, msg.includeSubdomains)
      .then(results => sendResponse({ results }))
      .catch(e => sendResponse({ results: [{ type: "global", ok: false, error: e.message }] }));
    return true;
  }
});
