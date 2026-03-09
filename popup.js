(async () => {
  const domainInput = document.getElementById("domain");
  const btn = document.getElementById("btn");
  const statusEl = document.getElementById("status");
  const includeHttp = document.getElementById("includeHttp");
  const autoReload = document.getElementById("autoReload");

  const INTERNAL_PROTOCOLS = ["chrome:", "chrome-extension:", "edge:", "about:", "file:", "devtools:"];

  // Pre-fill with active tab domain and auto-detect protocol
  let activeTabId = null;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      const url = new URL(tab.url);
      if (url.hostname && !INTERNAL_PROTOCOLS.includes(url.protocol)) {
        domainInput.value = url.hostname;
        activeTabId = tab.id;
        if (url.protocol === "http:") {
          includeHttp.checked = true;
        }
      }
    }
  } catch (_) {}

  // Select all / none
  document.getElementById("selectAll").addEventListener("click", () => {
    document.querySelectorAll(".opt").forEach(cb => cb.checked = true);
  });
  document.getElementById("selectNone").addEventListener("click", () => {
    document.querySelectorAll(".opt").forEach(cb => cb.checked = false);
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
      { action: "clearDomain", domain, types, includeHttp: includeHttp.checked },
      (res) => {
        btn.disabled = false;
        btn.textContent = "Clear selected data";

        if (!res) {
          showError("No response from service worker");
          return;
        }

        showStatus(res.results);

        // Reload active tab if option is checked and all succeeded
        const allOk = res.results.every(r => r.ok);
        if (autoReload.checked && allOk && activeTabId) {
          chrome.tabs.reload(activeTabId);
        }
      }
    );
  });
})();
