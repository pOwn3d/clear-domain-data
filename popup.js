(async () => {
  const domainInput = document.getElementById("domain");
  const btn = document.getElementById("btn");
  const statusEl = document.getElementById("status");
  const includeHttp = document.getElementById("includeHttp");
  const autoReload = document.getElementById("autoReload");
  const includeSubdomains = document.getElementById("includeSubdomains");
  const autoClose = document.getElementById("autoClose");

  const INTERNAL_PROTOCOLS = ["chrome:", "chrome-extension:", "edge:", "about:", "file:", "devtools:"];
  const STORAGE_KEY = "clearDomainPrefs";

  // Load saved preferences
  try {
    const stored = await chrome.storage.local.get(STORAGE_KEY);
    const prefs = stored[STORAGE_KEY];
    if (prefs) {
      if (prefs.includeHttp != null) includeHttp.checked = prefs.includeHttp;
      if (prefs.autoReload != null) autoReload.checked = prefs.autoReload;
      if (prefs.autoClose != null) autoClose.checked = prefs.autoClose;
      if (prefs.includeSubdomains != null) includeSubdomains.checked = prefs.includeSubdomains;
      if (prefs.types) {
        document.querySelectorAll(".opt").forEach(cb => {
          cb.checked = prefs.types.includes(cb.value);
        });
      }
    }
  } catch (_) {}

  // Save preferences on change
  function savePrefs() {
    const prefs = {
      includeHttp: includeHttp.checked,
      autoReload: autoReload.checked,
      autoClose: autoClose.checked,
      includeSubdomains: includeSubdomains.checked,
      types: [...document.querySelectorAll(".opt:checked")].map(cb => cb.value),
    };
    chrome.storage.local.set({ [STORAGE_KEY]: prefs });
  }

  // Listen for preference changes
  [includeHttp, autoReload, autoClose, includeSubdomains].forEach(el => {
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
          // Show brief success feedback, reload tab, then close popup
          showSuccess();
          btn.textContent = "Done!";
          btn.style.background = "#2e7d32";

          if (autoReload.checked && activeTabId) {
            chrome.tabs.reload(activeTabId);
          }

          setTimeout(() => window.close(), 600);
        } else {
          // Show detailed results (errors or autoClose disabled)
          btn.disabled = false;
          btn.textContent = "Clear selected data";
          showStatus(res.results);

          if (autoReload.checked && allOk && activeTabId) {
            chrome.tabs.reload(activeTabId);
          }
        }
      }
    );
  });
})();
