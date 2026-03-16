(async () => {
  const domainInput = document.getElementById("domain");
  const btn = document.getElementById("btn");
  const statusEl = document.getElementById("status");
  const includeHttp = document.getElementById("includeHttp");
  const autoReload = document.getElementById("autoReload");
  const includeSubdomains = document.getElementById("includeSubdomains");
  const autoClose = document.getElementById("autoClose");
  const confirmClear = document.getElementById("confirmClear");
  const showNotification = document.getElementById("showNotification");
  const recentsWrapper = document.getElementById("recentsWrapper");
  const recentsList = document.getElementById("recentsList");
  const clearRecents = document.getElementById("clearRecents");
  const cookieCountEl = document.getElementById("cookieCount");
  const confirmModal = document.getElementById("confirmModal");
  const confirmDomain = document.getElementById("confirmDomain");
  const confirmYes = document.getElementById("confirmYes");
  const confirmNo = document.getElementById("confirmNo");

  const INTERNAL_PROTOCOLS = ["chrome:", "chrome-extension:", "edge:", "about:", "file:", "devtools:"];
  const STORAGE_KEY = "clearDomainPrefs";
  const DEFAULT_SHORTCUT = { key: "x", meta: true, shift: true };
  let currentShortcut = DEFAULT_SHORTCUT;

  // Load saved preferences
  try {
    const stored = await chrome.storage.local.get(STORAGE_KEY);
    const prefs = stored[STORAGE_KEY];
    if (prefs) {
      if (prefs.includeHttp != null) includeHttp.checked = prefs.includeHttp;
      if (prefs.autoReload != null) autoReload.checked = prefs.autoReload;
      if (prefs.autoClose != null) autoClose.checked = prefs.autoClose;
      if (prefs.includeSubdomains != null) includeSubdomains.checked = prefs.includeSubdomains;
      if (prefs.confirmClear != null) confirmClear.checked = prefs.confirmClear;
      if (prefs.showNotification != null) showNotification.checked = prefs.showNotification;
      if (prefs.types) {
        document.querySelectorAll(".opt").forEach(cb => {
          cb.checked = prefs.types.includes(cb.value);
        });
      }
      if (prefs.shortcut) currentShortcut = prefs.shortcut;
    }
  } catch (_) {}

  // Save preferences on change
  function savePrefs(extraFields) {
    const prefs = {
      includeHttp: includeHttp.checked,
      autoReload: autoReload.checked,
      autoClose: autoClose.checked,
      includeSubdomains: includeSubdomains.checked,
      confirmClear: confirmClear.checked,
      showNotification: showNotification.checked,
      types: [...document.querySelectorAll(".opt:checked")].map(cb => cb.value),
      shortcut: currentShortcut,
      ...extraFields,
    };
    chrome.storage.local.set({ [STORAGE_KEY]: prefs });
  }

  // Listen for preference changes
  [includeHttp, autoReload, autoClose, includeSubdomains, confirmClear, showNotification].forEach(el => {
    el.addEventListener("change", savePrefs);
  });
  document.querySelectorAll(".opt").forEach(cb => cb.addEventListener("change", savePrefs));

  // Pre-fill with active tab domain and auto-detect protocol
  let activeTabId = null;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      const url = new URL(tab.url);
      if (url.hostname && !INTERNAL_PROTOCOLS.includes(url.protocol)) {
        domainInput.value = url.host; // host includes port if non-default
        activeTabId = tab.id;
        if (url.protocol === "http:") {
          includeHttp.checked = true;
        }
      }
    }
  } catch (_) {}

  // Auto-focus and select domain input
  domainInput.focus();
  domainInput.select();

  // Cookie counter
  let cookieCountTimeout;
  function updateCookieCount() {
    const domain = domainInput.value.trim();
    if (!domain) { cookieCountEl.textContent = ""; return; }
    clearTimeout(cookieCountTimeout);
    cookieCountTimeout = setTimeout(() => {
      chrome.runtime.sendMessage({ action: "getCookieCount", domain }, (res) => {
        if (res?.count > 0) {
          cookieCountEl.textContent = `${res.count} cookie${res.count > 1 ? "s" : ""} found`;
        } else {
          cookieCountEl.textContent = "";
        }
      });
    }, 300);
  }

  domainInput.addEventListener("input", updateCookieCount);
  updateCookieCount();

  // Recent domains
  function loadRecents() {
    chrome.runtime.sendMessage({ action: "getRecentDomains" }, (res) => {
      const recents = res?.recents || [];
      if (recents.length === 0) {
        recentsWrapper.style.display = "none";
        return;
      }
      recentsWrapper.style.display = "block";
      recentsList.innerHTML = "";
      recents.forEach(domain => {
        const chip = document.createElement("span");
        chip.className = "recent-chip";
        chip.textContent = domain;
        chip.title = domain;
        chip.addEventListener("click", () => {
          domainInput.value = domain;
          updateCookieCount();
        });
        recentsList.appendChild(chip);
      });
    });
  }

  loadRecents();

  clearRecents.addEventListener("click", () => {
    chrome.storage.local.set({ recentDomains: [] });
    recentsWrapper.style.display = "none";
  });

  // Select all / none
  document.getElementById("selectAll").addEventListener("click", () => {
    document.querySelectorAll(".opt").forEach(cb => cb.checked = true);
    savePrefs();
  });
  document.getElementById("selectNone").addEventListener("click", () => {
    document.querySelectorAll(".opt").forEach(cb => cb.checked = false);
    savePrefs();
  });

  // Submit on Enter key
  domainInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") btn.click();
  });

  function showStatus(items) {
    statusEl.replaceChildren();
    items.forEach((item, i) => {
      const div = document.createElement("div");
      div.className = "result-item " + (item.ok ? "result-ok" : "result-err");
      const label = item.ok ? "OK" : "ERR";
      div.textContent = `[${label}] ${item.type}${item.error ? " — " + item.error : ""}`;
      div.style.animationDelay = `${i * 50}ms`;
      statusEl.appendChild(div);
    });
  }

  function showSuccess() {
    statusEl.replaceChildren();
    const div = document.createElement("div");
    div.className = "result-item result-ok success-flash";
    div.textContent = "Data cleared successfully";
    statusEl.appendChild(div);
  }

  function showError(message) {
    statusEl.replaceChildren();
    const span = document.createElement("span");
    span.className = "result-err";
    span.textContent = message;
    statusEl.appendChild(span);
  }

  // Shortcut recorder
  const shortcutBtn = document.getElementById("shortcutBtn");
  const shortcutKeys = document.getElementById("shortcutKeys");
  const shortcutReset = document.getElementById("shortcutReset");
  const isMac = navigator.platform.includes("Mac");

  function formatShortcut(sc) {
    const parts = [];
    if (sc.meta) parts.push(isMac ? "⌘" : "Win");
    if (sc.ctrl) parts.push(isMac ? "⌃" : "Ctrl");
    if (sc.alt) parts.push(isMac ? "⌥" : "Alt");
    if (sc.shift) parts.push(isMac ? "⇧" : "Shift");
    parts.push(sc.key.toUpperCase());
    return parts.map(k => `<kbd>${k}</kbd>`).join(" ");
  }

  shortcutKeys.innerHTML = formatShortcut(currentShortcut);

  let recording = false;

  shortcutBtn.addEventListener("click", () => {
    recording = true;
    shortcutBtn.classList.add("recording");
    shortcutKeys.innerHTML = '<span class="recording-text">Press keys…</span>';
  });

  document.addEventListener("keydown", (e) => {
    if (!recording) return;
    // Ignore lone modifier keys
    if (["Meta", "Control", "Alt", "Shift"].includes(e.key)) return;

    e.preventDefault();
    e.stopPropagation();

    // Require at least one modifier
    if (!e.metaKey && !e.ctrlKey && !e.altKey) {
      shortcutKeys.innerHTML = '<span class="recording-text">Add a modifier key</span>';
      return;
    }

    const sc = {
      key: e.key.length === 1 ? e.key.toLowerCase() : e.key,
      meta: e.metaKey || false,
      ctrl: e.ctrlKey || false,
      shift: e.shiftKey || false,
      alt: e.altKey || false,
    };

    currentShortcut = sc;
    recording = false;
    shortcutBtn.classList.remove("recording");
    shortcutKeys.innerHTML = formatShortcut(sc);
    savePrefs({ shortcut: sc });
  }, true);

  // Cancel recording on click outside
  document.addEventListener("click", (e) => {
    if (recording && !shortcutBtn.contains(e.target)) {
      recording = false;
      shortcutBtn.classList.remove("recording");
      shortcutKeys.innerHTML = formatShortcut(currentShortcut);
    }
  });

  shortcutReset.addEventListener("click", () => {
    currentShortcut = DEFAULT_SHORTCUT;
    recording = false;
    shortcutBtn.classList.remove("recording");
    shortcutKeys.innerHTML = formatShortcut(currentShortcut);
    savePrefs({ shortcut: DEFAULT_SHORTCUT });
  });

  function executeClear() {
    const domain = domainInput.value.trim();
    const types = [...document.querySelectorAll(".opt:checked")].map(cb => cb.value);

    btn.disabled = true;
    btn.textContent = "Clearing...";
    statusEl.replaceChildren();

    chrome.runtime.sendMessage(
      {
        action: "clearDomain",
        domain,
        types,
        includeHttp: includeHttp.checked,
        includeSubdomains: includeSubdomains.checked,
      },
      (res) => {
        if (!res) {
          btn.disabled = false;
          btn.textContent = "Clear selected data";
          showError("No response from service worker");
          return;
        }

        const allOk = res.results.every(r => r.ok);

        if (allOk && autoClose.checked) {
          showSuccess();
          btn.textContent = "Done!";
          btn.style.background = "#2e7d32";
          loadRecents();

          if (autoReload.checked && activeTabId) {
            chrome.tabs.reload(activeTabId);
          }

          setTimeout(() => window.close(), 600);
        } else {
          btn.disabled = false;
          btn.textContent = "Clear selected data";
          showStatus(res.results);

          if (allOk) loadRecents();

          if (autoReload.checked && allOk && activeTabId) {
            chrome.tabs.reload(activeTabId);
          }
        }
      }
    );
  }

  btn.addEventListener("click", () => {
    const domain = domainInput.value.trim();
    if (!domain) {
      showError("Enter a domain");
      domainInput.focus();
      return;
    }

    const types = [...document.querySelectorAll(".opt:checked")].map(cb => cb.value);
    if (types.length === 0) {
      showError("Select at least one data type");
      return;
    }

    if (confirmClear.checked) {
      confirmDomain.textContent = domain;
      confirmModal.style.display = "flex";
    } else {
      executeClear();
    }
  });

  confirmYes.addEventListener("click", () => {
    confirmModal.style.display = "none";
    executeClear();
  });

  confirmNo.addEventListener("click", () => {
    confirmModal.style.display = "none";
  });
})();
