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

  const langSelect = document.getElementById("langSelect");

  const INTERNAL_PROTOCOLS = ["chrome:", "chrome-extension:", "edge:", "about:", "file:", "devtools:"];
  const STORAGE_KEY = "clearDomainPrefs";
  const DEFAULT_SHORTCUT = { key: "x", meta: true, shift: true };
  let currentShortcut = DEFAULT_SHORTCUT;
  let currentLoader = "spinner";
  let currentLang = "en";

  // i18n translations
  const I18N = {
    en: {
      recentLabel: "Recent", clearRecents: "Clear", dataTypes: "Data types",
      all: "All", none: "None", clearBtn: "Clear selected data",
      clearing: "Clearing...", done: "Done!",
      reloadTab: "Reload tab", autoClose: "Auto-close",
      confirmBefore: "Confirm before clear", notifyShortcut: "Notify on shortcut",
      loader: "Loader:", quickClear: "Quick clear:",
      confirmMsg: "Clear data for", confirmYes: "Clear", confirmNo: "Cancel",
      enterDomain: "Enter a domain", selectType: "Select at least one data type",
      noResponse: "No response from service worker", success: "Data cleared successfully",
      cookiesFound: "{n} cookie{s} found",
      http: "HTTP", subdomains: "Subdomains",
      // Loader texts
      l_spinner: "Clearing…", l_pacman: "Eating data…", l_broom: "Sweeping…",
      l_matrix: "Purging…", l_nuke: "Nuking…", l_fire: "Burning data…", l_bounce: "Clearing…",
    },
    fr: {
      recentLabel: "Récents", clearRecents: "Effacer", dataTypes: "Types de données",
      all: "Tout", none: "Aucun", clearBtn: "Effacer les données",
      clearing: "Suppression...", done: "Terminé !",
      reloadTab: "Recharger l'onglet", autoClose: "Fermeture auto",
      confirmBefore: "Confirmer avant", notifyShortcut: "Notifier au raccourci",
      loader: "Animation :", quickClear: "Raccourci :",
      confirmMsg: "Effacer les données de", confirmYes: "Effacer", confirmNo: "Annuler",
      enterDomain: "Entrez un domaine", selectType: "Sélectionnez au moins un type",
      noResponse: "Pas de réponse du service worker", success: "Données effacées",
      cookiesFound: "{n} cookie{s} trouvé{s}",
      http: "HTTP", subdomains: "Sous-domaines",
      l_spinner: "Suppression…", l_pacman: "Miam miam…", l_broom: "Nettoyage…",
      l_matrix: "Purge…", l_nuke: "Destruction…", l_fire: "Ça brûle…", l_bounce: "Suppression…",
    },
    es: {
      recentLabel: "Recientes", clearRecents: "Borrar", dataTypes: "Tipos de datos",
      all: "Todo", none: "Nada", clearBtn: "Borrar datos",
      clearing: "Borrando...", done: "¡Listo!",
      reloadTab: "Recargar pestaña", autoClose: "Cierre auto",
      confirmBefore: "Confirmar antes", notifyShortcut: "Notificar al atajo",
      loader: "Animación:", quickClear: "Atajo rápido:",
      confirmMsg: "¿Borrar datos de", confirmYes: "Borrar", confirmNo: "Cancelar",
      enterDomain: "Ingrese un dominio", selectType: "Seleccione al menos un tipo",
      noResponse: "Sin respuesta del service worker", success: "Datos borrados",
      cookiesFound: "{n} cookie{s} encontrada{s}",
      http: "HTTP", subdomains: "Subdominios",
      l_spinner: "Borrando…", l_pacman: "Comiendo datos…", l_broom: "Barriendo…",
      l_matrix: "Purgando…", l_nuke: "Destruyendo…", l_fire: "Quemando…", l_bounce: "Borrando…",
    },
    de: {
      recentLabel: "Zuletzt", clearRecents: "Löschen", dataTypes: "Datentypen",
      all: "Alle", none: "Keine", clearBtn: "Daten löschen",
      clearing: "Lösche...", done: "Fertig!",
      reloadTab: "Tab neu laden", autoClose: "Auto-Schließen",
      confirmBefore: "Vorher bestätigen", notifyShortcut: "Bei Shortcut benachrichtigen",
      loader: "Animation:", quickClear: "Schnelltaste:",
      confirmMsg: "Daten löschen für", confirmYes: "Löschen", confirmNo: "Abbrechen",
      enterDomain: "Domain eingeben", selectType: "Mindestens einen Typ auswählen",
      noResponse: "Keine Antwort vom Service Worker", success: "Daten gelöscht",
      cookiesFound: "{n} Cookie{s} gefunden",
      http: "HTTP", subdomains: "Subdomains",
      l_spinner: "Lösche…", l_pacman: "Frisst Daten…", l_broom: "Fegt…",
      l_matrix: "Bereinige…", l_nuke: "Zerstöre…", l_fire: "Verbrennt…", l_bounce: "Lösche…",
    },
    pt: {
      recentLabel: "Recentes", clearRecents: "Limpar", dataTypes: "Tipos de dados",
      all: "Todos", none: "Nenhum", clearBtn: "Limpar dados",
      clearing: "Limpando...", done: "Pronto!",
      reloadTab: "Recarregar aba", autoClose: "Fechar auto",
      confirmBefore: "Confirmar antes", notifyShortcut: "Notificar no atalho",
      loader: "Animação:", quickClear: "Atalho rápido:",
      confirmMsg: "Limpar dados de", confirmYes: "Limpar", confirmNo: "Cancelar",
      enterDomain: "Digite um domínio", selectType: "Selecione pelo menos um tipo",
      noResponse: "Sem resposta do service worker", success: "Dados limpos",
      cookiesFound: "{n} cookie{s} encontrado{s}",
      http: "HTTP", subdomains: "Subdomínios",
      l_spinner: "Limpando…", l_pacman: "Comendo dados…", l_broom: "Varrendo…",
      l_matrix: "Purgando…", l_nuke: "Destruindo…", l_fire: "Queimando…", l_bounce: "Limpando…",
    },
  };

  function t(key) { return (I18N[currentLang] || I18N.en)[key] || I18N.en[key] || key; }

  function applyLang() {
    // Section labels
    document.querySelectorAll(".section-label").forEach((el, i) => {
      if (i === 0) el.textContent = t("recentLabel");
      if (i === 1) el.textContent = t("dataTypes");
    });
    clearRecents.textContent = t("clearRecents");
    document.getElementById("selectAll").textContent = t("all");
    document.getElementById("selectNone").textContent = t("none");
    btn.textContent = t("clearBtn");

    // Bottom options - update text nodes only
    autoReload.parentElement.lastChild.textContent = " " + t("reloadTab");
    autoClose.parentElement.lastChild.textContent = " " + t("autoClose");
    confirmClear.parentElement.lastChild.textContent = " " + t("confirmBefore");
    showNotification.parentElement.lastChild.textContent = " " + t("notifyShortcut");

    // Toggle chips
    includeHttp.parentElement.lastChild.textContent = " " + t("http");
    includeSubdomains.parentElement.lastChild.textContent = " " + t("subdomains");

    // Loader & shortcut labels
    document.querySelector(".loader-label").textContent = t("loader");
    document.querySelector(".shortcut-label").textContent = t("quickClear");

    // Confirm modal
    confirmYes.textContent = t("confirmYes");
    confirmNo.textContent = t("confirmNo");
  }

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
      if (prefs.loaderStyle) currentLoader = prefs.loaderStyle;
      if (prefs.lang) currentLang = prefs.lang;
    }
  } catch (_) {}

  // Apply language
  langSelect.value = currentLang;
  applyLang();

  langSelect.addEventListener("change", () => {
    currentLang = langSelect.value;
    applyLang();
    savePrefs({ lang: currentLang });
  });

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
      loaderStyle: currentLoader,
      lang: currentLang,
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
          const s = res.count > 1 ? "s" : "";
          cookieCountEl.textContent = t("cookiesFound").replace("{n}", res.count).replace(/{s}/g, s);
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
    div.textContent = t("success");
    statusEl.appendChild(div);
  }

  function showError(message) {
    statusEl.replaceChildren();
    const span = document.createElement("span");
    span.className = "result-err";
    span.textContent = message;
    statusEl.appendChild(span);
  }

  // Loader picker
  const loaderBtns = document.querySelectorAll(".loader-pick");
  loaderBtns.forEach(btn => {
    if (btn.dataset.loader === currentLoader) {
      loaderBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    }
    btn.addEventListener("click", () => {
      loaderBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentLoader = btn.dataset.loader;
      savePrefs({ loaderStyle: currentLoader });
    });
  });

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
    const msg = {
      action: "clearDomain",
      domain,
      types,
      includeHttp: includeHttp.checked,
      includeSubdomains: includeSubdomains.checked,
      autoReload: autoReload.checked,
    };

    // Fire-and-forget: close popup immediately, background handles the rest
    if (autoClose.checked) {
      chrome.runtime.sendMessage(msg);
      window.close();
      return;
    }

    // Stay open: wait for results
    btn.disabled = true;
    btn.textContent = t("clearing");
    statusEl.replaceChildren();

    chrome.runtime.sendMessage(msg, (res) => {
      if (!res) {
        btn.disabled = false;
        btn.textContent = t("clearBtn");
        showError(t("noResponse"));
        return;
      }

      const allOk = res.results.every(r => r.ok);
      btn.disabled = false;
      btn.textContent = t("clearBtn");
      showStatus(res.results);

      if (allOk) loadRecents();

      if (autoReload.checked && allOk && activeTabId) {
        chrome.tabs.reload(activeTabId);
      }
    });
  }

  btn.addEventListener("click", () => {
    const domain = domainInput.value.trim();
    if (!domain) {
      showError(t("enterDomain"));
      domainInput.focus();
      return;
    }

    const types = [...document.querySelectorAll(".opt:checked")].map(cb => cb.value);
    if (types.length === 0) {
      showError(t("selectType"));
      return;
    }

    if (confirmClear.checked) {
      document.querySelector(".confirm-content p").innerHTML = `${t("confirmMsg")} <strong>${domain}</strong>?`;
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
