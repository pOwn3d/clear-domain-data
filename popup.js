(async () => {
  const domainInput = document.getElementById("domain");
  const btn = document.getElementById("btn");
  const statusEl = document.getElementById("status");
  const includeHttp = document.getElementById("includeHttp");

  // Pre-fill with active tab domain
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      const url = new URL(tab.url);
      if (url.hostname && !url.protocol.startsWith("chrome")) {
        domainInput.value = url.hostname;
      }
    }
  } catch (_) {}

  document.getElementById("selectAll").addEventListener("click", () => {
    document.querySelectorAll(".opt").forEach(cb => cb.checked = true);
  });
  document.getElementById("selectNone").addEventListener("click", () => {
    document.querySelectorAll(".opt").forEach(cb => cb.checked = false);
  });

  function showStatus(items) {
    statusEl.replaceChildren();
    for (const item of items) {
      const div = document.createElement("div");
      div.className = "result-item " + (item.ok ? "result-ok" : "result-err");
      const label = item.ok ? "OK" : "ERREUR";
      div.textContent = `[${label}] ${item.type}${item.error ? " — " + item.error : ""}`;
      statusEl.appendChild(div);
    }
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
      showError("Saisir un domaine");
      return;
    }

    const types = [...document.querySelectorAll(".opt:checked")].map(cb => cb.value);
    if (types.length === 0) {
      showError("Cocher au moins un type");
      return;
    }

    btn.disabled = true;
    btn.textContent = "Nettoyage...";
    statusEl.replaceChildren();

    chrome.runtime.sendMessage(
      { action: "clearDomain", domain, types, includeHttp: includeHttp.checked },
      (res) => {
        btn.disabled = false;
        btn.textContent = "Vider les données sélectionnées";

        if (!res) {
          showError("Pas de réponse du service worker");
          return;
        }

        showStatus(res.results);
      }
    );
  });
})();
