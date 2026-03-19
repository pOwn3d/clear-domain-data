const CLEAR_FUNCTIONS = {
  cache: "removeCache",
  cookies: "removeCookies",
  localStorage: "removeLocalStorage",
  indexedDB: "removeIndexedDB",
  serviceWorkers: "removeServiceWorkers",
  cacheStorage: "removeCacheStorage",
};

const EXTRA_TYPES = ["sessionStorage", "history"];
const VALID_TYPES = new Set([...Object.keys(CLEAR_FUNCTIONS), ...EXTRA_TYPES]);
const ALL_TYPES = [...Object.keys(CLEAR_FUNCTIONS), ...EXTRA_TYPES];
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

async function trackRecentDomain(domain) {
  const stored = await chrome.storage.local.get("recentDomains");
  let recents = stored.recentDomains || [];
  recents = recents.filter(d => d !== domain);
  recents.unshift(domain);
  recents = recents.slice(0, 10);
  await chrome.storage.local.set({ recentDomains: recents });
}

async function sendOverlay(tabId, state) {
  try {
    const stored = await chrome.storage.local.get(STORAGE_KEY);
    const loaderStyle = stored[STORAGE_KEY]?.loaderStyle || "spinner";
    chrome.tabs.sendMessage(tabId, { action: "showOverlay", state, loaderStyle });
  } catch (_) {}
}

async function clearDomainData(domain, types, includeHttp, includeSubdomains) {
  if (!validateDomain(domain)) throw new Error("Invalid domain");
  if (!validateTypes(types)) throw new Error("Invalid data types");

  const origins = [`https://${domain}`];
  if (includeHttp) origins.push(`http://${domain}`);

  // Filter out sessionStorage since it's not a browsingData API type
  const browsingDataTypes = types.filter(t => t in CLEAR_FUNCTIONS);

  // Clear exact domain
  const results = await Promise.all(browsingDataTypes.map(async (type) => {
    const fn = CLEAR_FUNCTIONS[type];
    try {
      await chrome.browsingData[fn]({ origins });
      return { type, ok: true };
    } catch (e) {
      return { type, ok: false, error: e.message };
    }
  }));

  // sessionStorage is handled via content script, just report success here
  if (types.includes("sessionStorage")) {
    results.push({ type: "sessionStorage", ok: true });
  }

  // History: use chrome.history API to delete URLs matching the domain
  if (types.includes("history")) {
    try {
      const items = await chrome.history.search({ text: domain, startTime: 0, maxResults: 10000 });
      const matching = items.filter(item => {
        try { return new URL(item.url).host === domain; } catch (_) { return false; }
      });
      await Promise.all(matching.map(item => chrome.history.deleteUrl({ url: item.url })));
      results.push({ type: "history", ok: true });
    } catch (e) {
      results.push({ type: "history", ok: false, error: e.message });
    }
  }

  // Clear subdomain cookies if requested
  if (includeSubdomains) {
    const baseDomain = domain.replace(/:\d+$/, "");
    const subResults = await Promise.all(browsingDataTypes.map(async (type) => {
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

    sendOverlay(tab.id, "clearing");

    const results = await clearDomainData(domain, types, includeHttp, includeSubdomains);
    const allOk = results.every(r => r.ok);

    if (types.includes("sessionStorage")) {
      try {
        await chrome.tabs.sendMessage(tab.id, { action: "clearSessionStorage" });
      } catch (_) {}
    }

    sendOverlay(tab.id, allOk ? "success" : "error");

    // Show badge feedback
    chrome.action.setBadgeText({ text: allOk ? "✓" : "✗", tabId: tab.id });
    chrome.action.setBadgeBackgroundColor({ color: allOk ? "#2e7d32" : "#c62828", tabId: tab.id });
    setTimeout(() => chrome.action.setBadgeText({ text: "", tabId: tab.id }), 2000);

    const showNotif = prefs.showNotification !== false;
    if (showNotif) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon-128.png",
        title: "Clear Domain Data",
        message: allOk ? `Cleared ${domain}` : `Error clearing ${domain}`,
        silent: true,
      });
    }

    if (allOk) await trackRecentDomain(domain);

    if (allOk && (prefs.autoReload !== false)) {
      chrome.tabs.reload(tab.id);
    }
  } catch (_) {}
});

// Shortcut clear (from content script) and popup message handler
async function handleShortcutClear(tabId) {
  const [tab] = tabId
    ? [{ id: tabId, url: (await chrome.tabs.get(tabId)).url }]
    : await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return;

  const url = new URL(tab.url);
  const domain = url.host;
  if (!validateDomain(domain)) return;

  const stored = await chrome.storage.local.get(STORAGE_KEY);
  const prefs = stored[STORAGE_KEY] || {};
  const types = prefs.types || ALL_TYPES;
  const includeHttp = prefs.includeHttp || false;
  const includeSubdomains = prefs.includeSubdomains || false;

  sendOverlay(tab.id, "clearing");

  const results = await clearDomainData(domain, types, includeHttp, includeSubdomains);
  const allOk = results.every(r => r.ok);

  if (types.includes("sessionStorage")) {
    try {
      await chrome.tabs.sendMessage(tab.id, { action: "clearSessionStorage" });
    } catch (_) {}
  }

  sendOverlay(tab.id, allOk ? "success" : "error");

  chrome.action.setBadgeText({ text: allOk ? "✓" : "✗", tabId: tab.id });
  chrome.action.setBadgeBackgroundColor({ color: allOk ? "#2e7d32" : "#c62828", tabId: tab.id });
  setTimeout(() => chrome.action.setBadgeText({ text: "", tabId: tab.id }), 2000);

  const showNotif = prefs.showNotification !== false;
  if (showNotif) {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon-128.png",
      title: "Clear Domain Data",
      message: allOk ? `Cleared ${domain}` : `Error clearing ${domain}`,
      silent: true,
    });
  }

  if (allOk) await trackRecentDomain(domain);

  if (allOk && (prefs.autoReload !== false)) {
    chrome.tabs.reload(tab.id);
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "shortcutClear") {
    handleShortcutClear(sender.tab?.id).catch(() => {});
    return false;
  }
  if (msg.action === "clearDomain") {
    (async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true }).catch(() => []);
      if (tab) sendOverlay(tab.id, "clearing");

      const results = await clearDomainData(msg.domain, msg.types, msg.includeHttp, msg.includeSubdomains);

      if (msg.types.includes("sessionStorage") && tab) {
        try { await chrome.tabs.sendMessage(tab.id, { action: "clearSessionStorage" }); } catch (_) {}
      }

      const allOk = results.every(r => r.ok);
      if (tab) sendOverlay(tab.id, allOk ? "success" : "error");
      if (allOk) await trackRecentDomain(msg.domain);

      if (msg.autoReload && allOk && tab) {
        chrome.tabs.reload(tab.id);
      }

      sendResponse({ results });
    })().catch(e => sendResponse({ results: [{ type: "global", ok: false, error: e.message }] }));
    return true;
  }
  if (msg.action === "getCookieCount") {
    chrome.cookies.getAll({ domain: msg.domain })
      .then(cookies => sendResponse({ count: cookies.length }))
      .catch(() => sendResponse({ count: 0 }));
    return true;
  }
  if (msg.action === "getRecentDomains") {
    chrome.storage.local.get("recentDomains")
      .then(stored => sendResponse({ recents: stored.recentDomains || [] }))
      .catch(() => sendResponse({ recents: [] }));
    return true;
  }
});
