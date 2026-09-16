(async () => {
  const domainInput = document.getElementById("domain");
  const domainTags = document.getElementById("domainTags");
  const domainMeta = document.getElementById("domainMeta");
  const addDomainBtn = document.getElementById("addDomain");
  const btn = document.getElementById("btn");
  const btnLabel = document.getElementById("btnLabel");
  const ctaShortcut = document.getElementById("ctaShortcut");
  const formError = document.getElementById("formError");
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
  const typeCountEl = document.getElementById("typeCount");
  const typeCheckboxes = document.querySelectorAll(".opt");
  const confirmModal = document.getElementById("confirmModal");
  const confirmText = document.getElementById("confirmText");
  const confirmDomains = document.getElementById("confirmDomains");
  const confirmYes = document.getElementById("confirmYes");
  const confirmNo = document.getElementById("confirmNo");
  const langSelect = document.getElementById("langSelect");
  const headerMain = document.getElementById("headerMain");
  const headerSettings = document.getElementById("headerSettings");
  const openSettings = document.getElementById("openSettings");
  const closeSettings = document.getElementById("closeSettings");
  const viewMain = document.getElementById("viewMain");
  const viewResults = document.getElementById("viewResults");
  const viewSettings = document.getElementById("viewSettings");
  const resultsBanner = document.getElementById("resultsBanner");
  const resultsTitle = document.getElementById("resultsTitle");
  const resultsSub = document.getElementById("resultsSub");
  const resultsList = document.getElementById("resultsList");
  const resultsBack = document.getElementById("resultsBack");
  const loaderBtns = document.querySelectorAll(".loader-pick");
  const shortcutBtn = document.getElementById("shortcutBtn");
  const shortcutKeys = document.getElementById("shortcutKeys");
  const shortcutHint = document.getElementById("shortcutHint");
  const shortcutReset = document.getElementById("shortcutReset");

  const INTERNAL_PROTOCOLS = ["chrome:", "chrome-extension:", "edge:", "about:", "file:", "devtools:"];
  const STORAGE_KEY = "clearDomainPrefs";
  const DEFAULT_SHORTCUT = { key: "x", meta: true, shift: true };
  // Technical API names are shown as-is in every language
  const TYPE_LABELS = {
    cache: "Cache", cookies: "Cookies", localStorage: "localStorage", indexedDB: "IndexedDB",
    serviceWorkers: "Service Workers", cacheStorage: "CacheStorage", sessionStorage: "sessionStorage",
  };
  const isMac = navigator.platform.includes("Mac");

  let currentShortcut = DEFAULT_SHORTCUT;
  let currentLoader = "spinner";
  let currentLang = "en";
  let domains = [];
  let cookieCount = 0;
  let cookieCountTimeout;
  let cookieCountGeneration = 0;
  let recording = false;
  let recordingError = "";
  let activeTabId = null;
  let activeTabRootUrl = null;

  // i18n translations
  const I18N = {
    en: {
      settings: "Settings", back: "Back", sourceCode: "Source code",
      domains: "Domains", domainCount: "{n} domain{s}",
      addDomain: "Add a domain…", addDomainBtn: "Add domain", removeDomain: "Remove {d}",
      http: "Include HTTP", subdomains: "Subdomains",
      recentLabel: "Recent", clearRecents: "Clear",
      dataTypes: "Data types", all: "All", none: "None", history: "History",
      clearBtn: "Clear selected data", clearing: "Clearing…", done: "Done!",
      reloadTab: "Reload tab", autoClose: "Auto-close",
      enterDomain: "Enter a domain", selectType: "Select at least one data type",
      noResponse: "No response from service worker", globalError: "Error",
      cookiesFound: "{n} cookie{s} found",
      confirmTitle: "Clear data?", confirmText: "Permanently clear {n} data type{s} for:",
      confirmYes: "Clear", confirmNo: "Cancel",
      success: "Data cleared", resultsSubOk: "{n} operation{s} succeeded",
      resultsErr: "Finished with {n} error{s}", resultsSubErr: "Succeeded: {ok} · Failed: {err}",
      notReloaded: "tab not reloaded",
      general: "General", language: "Language", behavior: "Behavior",
      confirmBefore: "Ask for confirmation", confirmHint: "Before each clear from the popup",
      notifyShortcut: "Notify on shortcut", notifyHint: "System notification after a keyboard clear",
      shortcutSection: "Keyboard shortcut", quickClear: "Quick clear",
      shortcutHint: "Click the keys to change", pressKeys: "Press the combination… (Esc to cancel)",
      addModifier: "Add a modifier key", editShortcut: "Change shortcut", resetShortcut: "Reset to default",
      loader: "Page animation", ln_broom: "Broom", ln_fire: "Fire", ln_bounce: "Bounce",
      // Loader texts
      l_spinner: "Clearing…", l_pacman: "Eating data…", l_broom: "Sweeping…",
      l_matrix: "Purging…", l_nuke: "Nuking…", l_fire: "Burning data…", l_bounce: "Clearing…",
    },
    fr: {
      settings: "Réglages", back: "Retour", sourceCode: "Code source",
      domains: "Domaines", domainCount: "{n} domaine{s}",
      addDomain: "Ajouter un domaine…", addDomainBtn: "Ajouter le domaine", removeDomain: "Retirer {d}",
      http: "Inclure HTTP", subdomains: "Sous-domaines",
      recentLabel: "Récents", clearRecents: "Effacer",
      dataTypes: "Types de données", all: "Tout", none: "Aucun", history: "Historique",
      clearBtn: "Effacer les données", clearing: "Suppression…", done: "Terminé !",
      reloadTab: "Recharger l'onglet", autoClose: "Fermeture auto",
      enterDomain: "Entrez un domaine", selectType: "Sélectionnez au moins un type",
      noResponse: "Pas de réponse du service worker", globalError: "Erreur",
      cookiesFound: "{n} cookie{s} trouvé{s}",
      confirmTitle: "Effacer les données ?", confirmText: "Suppression définitive de {n} type{s} de données pour :",
      confirmYes: "Effacer", confirmNo: "Annuler",
      success: "Données effacées", resultsSubOk: "{n} opération{s} réussie{s}",
      resultsErr: "Terminé avec {n} erreur{s}", resultsSubErr: "Réussies : {ok} · Échecs : {err}",
      notReloaded: "onglet non rechargé",
      general: "Général", language: "Langue", behavior: "Comportement",
      confirmBefore: "Demander confirmation", confirmHint: "Avant chaque effacement depuis la popup",
      notifyShortcut: "Notifier au raccourci", notifyHint: "Notification système après un effacement clavier",
      shortcutSection: "Raccourci clavier", quickClear: "Effacement rapide",
      shortcutHint: "Cliquez sur les touches pour modifier", pressKeys: "Appuyez sur la combinaison… (Échap pour annuler)",
      addModifier: "Ajoutez une touche modificatrice", editShortcut: "Modifier le raccourci", resetShortcut: "Rétablir par défaut",
      loader: "Animation sur la page", ln_broom: "Balai", ln_fire: "Feu", ln_bounce: "Rebond",
      l_spinner: "Suppression…", l_pacman: "Miam miam…", l_broom: "Nettoyage…",
      l_matrix: "Purge…", l_nuke: "Destruction…", l_fire: "Ça brûle…", l_bounce: "Suppression…",
    },
    es: {
      settings: "Ajustes", back: "Volver", sourceCode: "Código fuente",
      domains: "Dominios", domainCount: "{n} dominio{s}",
      addDomain: "Añadir un dominio…", addDomainBtn: "Añadir dominio", removeDomain: "Quitar {d}",
      http: "Incluir HTTP", subdomains: "Subdominios",
      recentLabel: "Recientes", clearRecents: "Borrar",
      dataTypes: "Tipos de datos", all: "Todo", none: "Nada", history: "Historial",
      clearBtn: "Borrar datos", clearing: "Borrando…", done: "¡Listo!",
      reloadTab: "Recargar pestaña", autoClose: "Cierre auto",
      enterDomain: "Ingrese un dominio", selectType: "Seleccione al menos un tipo",
      noResponse: "Sin respuesta del service worker", globalError: "Error",
      cookiesFound: "{n} cookie{s} encontrada{s}",
      confirmTitle: "¿Borrar los datos?", confirmText: "Borrado definitivo de {n} tipo{s} de datos para:",
      confirmYes: "Borrar", confirmNo: "Cancelar",
      success: "Datos borrados", resultsSubOk: "Operaciones correctas: {n}",
      resultsErr: "Terminado con errores ({n})", resultsSubErr: "Correctas: {ok} · Fallidas: {err}",
      notReloaded: "pestaña no recargada",
      general: "General", language: "Idioma", behavior: "Comportamiento",
      confirmBefore: "Pedir confirmación", confirmHint: "Antes de cada borrado desde el popup",
      notifyShortcut: "Notificar al atajo", notifyHint: "Notificación del sistema tras un borrado con teclado",
      shortcutSection: "Atajo de teclado", quickClear: "Borrado rápido",
      shortcutHint: "Haz clic en las teclas para cambiar", pressKeys: "Pulsa la combinación… (Esc para cancelar)",
      addModifier: "Añade una tecla modificadora", editShortcut: "Cambiar atajo", resetShortcut: "Restablecer",
      loader: "Animación en la página", ln_broom: "Escoba", ln_fire: "Fuego", ln_bounce: "Rebote",
      l_spinner: "Borrando…", l_pacman: "Comiendo datos…", l_broom: "Barriendo…",
      l_matrix: "Purgando…", l_nuke: "Destruyendo…", l_fire: "Quemando…", l_bounce: "Borrando…",
    },
    de: {
      settings: "Einstellungen", back: "Zurück", sourceCode: "Quellcode",
      domains: "Domains", domainCount: "{n} Domain{s}",
      addDomain: "Domain hinzufügen…", addDomainBtn: "Domain hinzufügen", removeDomain: "{d} entfernen",
      http: "HTTP einbeziehen", subdomains: "Subdomains",
      recentLabel: "Zuletzt", clearRecents: "Löschen",
      dataTypes: "Datentypen", all: "Alle", none: "Keine", history: "Verlauf",
      clearBtn: "Daten löschen", clearing: "Lösche…", done: "Fertig!",
      reloadTab: "Tab neu laden", autoClose: "Auto-Schließen",
      enterDomain: "Domain eingeben", selectType: "Mindestens einen Typ auswählen",
      noResponse: "Keine Antwort vom Service Worker", globalError: "Fehler",
      cookiesFound: "{n} Cookie{s} gefunden",
      confirmTitle: "Daten löschen?", confirmText: "Datentypen ({n}) endgültig löschen für:",
      confirmYes: "Löschen", confirmNo: "Abbrechen",
      success: "Daten gelöscht", resultsSubOk: "Erfolgreiche Vorgänge: {n}",
      resultsErr: "Mit Fehlern abgeschlossen ({n})", resultsSubErr: "Erfolgreich: {ok} · Fehlgeschlagen: {err}",
      notReloaded: "Tab nicht neu geladen",
      general: "Allgemein", language: "Sprache", behavior: "Verhalten",
      confirmBefore: "Bestätigung anfordern", confirmHint: "Vor jedem Löschen im Popup",
      notifyShortcut: "Bei Shortcut benachrichtigen", notifyHint: "Systembenachrichtigung nach Löschen per Tastatur",
      shortcutSection: "Tastenkürzel", quickClear: "Schnelllöschen",
      shortcutHint: "Zum Ändern auf die Tasten klicken", pressKeys: "Kombination drücken… (Esc zum Abbrechen)",
      addModifier: "Modifikatortaste hinzufügen", editShortcut: "Kürzel ändern", resetShortcut: "Zurücksetzen",
      loader: "Animation auf der Seite", ln_broom: "Besen", ln_fire: "Feuer", ln_bounce: "Hüpfen",
      l_spinner: "Lösche…", l_pacman: "Frisst Daten…", l_broom: "Fegt…",
      l_matrix: "Bereinige…", l_nuke: "Zerstöre…", l_fire: "Verbrennt…", l_bounce: "Lösche…",
    },
    pt: {
      settings: "Configurações", back: "Voltar", sourceCode: "Código-fonte",
      domains: "Domínios", domainCount: "{n} domínio{s}",
      addDomain: "Adicionar um domínio…", addDomainBtn: "Adicionar domínio", removeDomain: "Remover {d}",
      http: "Incluir HTTP", subdomains: "Subdomínios",
      recentLabel: "Recentes", clearRecents: "Limpar",
      dataTypes: "Tipos de dados", all: "Todos", none: "Nenhum", history: "Histórico",
      clearBtn: "Limpar dados", clearing: "Limpando…", done: "Pronto!",
      reloadTab: "Recarregar aba", autoClose: "Fechar auto",
      enterDomain: "Digite um domínio", selectType: "Selecione pelo menos um tipo",
      noResponse: "Sem resposta do service worker", globalError: "Erro",
      cookiesFound: "{n} cookie{s} encontrado{s}",
      confirmTitle: "Limpar os dados?", confirmText: "Limpeza definitiva de {n} tipo{s} de dados para:",
      confirmYes: "Limpar", confirmNo: "Cancelar",
      success: "Dados limpos", resultsSubOk: "Operações concluídas: {n}",
      resultsErr: "Concluído com {n} erro{s}", resultsSubErr: "Concluídas: {ok} · Falhas: {err}",
      notReloaded: "aba não recarregada",
      general: "Geral", language: "Idioma", behavior: "Comportamento",
      confirmBefore: "Pedir confirmação", confirmHint: "Antes de cada limpeza pelo popup",
      notifyShortcut: "Notificar no atalho", notifyHint: "Notificação do sistema após limpeza pelo teclado",
      shortcutSection: "Atalho de teclado", quickClear: "Limpeza rápida",
      shortcutHint: "Clique nas teclas para alterar", pressKeys: "Pressione a combinação… (Esc para cancelar)",
      addModifier: "Adicione uma tecla modificadora", editShortcut: "Alterar atalho", resetShortcut: "Restaurar padrão",
      loader: "Animação na página", ln_broom: "Vassoura", ln_fire: "Fogo", ln_bounce: "Quicar",
      l_spinner: "Limpando…", l_pacman: "Comendo dados…", l_broom: "Varrendo…",
      l_matrix: "Purgando…", l_nuke: "Destruindo…", l_fire: "Queimando…", l_bounce: "Limpando…",
    },
  };

  function t(key) { return (I18N[currentLang] || I18N.en)[key] || I18N.en[key] || key; }

  // Fills {placeholders}; {s} becomes a plural "s" when vars.n > 1
  function tf(key, vars) {
    let text = t(key);
    if (vars.n != null) text = text.replace(/{s}/g, vars.n > 1 ? "s" : "");
    Object.entries(vars).forEach(([name, value]) => {
      text = text.replaceAll(`{${name}}`, value);
    });
    return text;
  }

  function applyLang() {
    document.documentElement.lang = currentLang;
    document.querySelectorAll("[data-i18n]").forEach(el => {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    // Icon-only buttons: accessible name and native tooltip
    document.querySelectorAll("[data-i18n-aria]").forEach(el => {
      const label = t(el.dataset.i18nAria);
      el.setAttribute("aria-label", label);
      el.title = label;
    });
    btnLabel.textContent = t("clearBtn");
    renderTags();
    updateDomainMeta();
    updateTypeCount();
    renderCookieCount();
    renderShortcut();
  }

  function cloneIcon(templateId) {
    return document.getElementById(templateId).content.firstElementChild.cloneNode(true);
  }

  // ── Views ──
  function showView(name) {
    viewMain.hidden = name !== "main";
    viewResults.hidden = name !== "results";
    viewSettings.hidden = name !== "settings";
    headerMain.hidden = name === "settings";
    headerSettings.hidden = name !== "settings";
  }

  // Save preferences on change
  function savePrefs(extraFields) {
    const prefs = {
      includeHttp: includeHttp.checked,
      autoReload: autoReload.checked,
      autoClose: autoClose.checked,
      includeSubdomains: includeSubdomains.checked,
      confirmClear: confirmClear.checked,
      showNotification: showNotification.checked,
      types: getSelectedTypes(),
      shortcut: currentShortcut,
      loaderStyle: currentLoader,
      lang: currentLang,
      ...extraFields,
    };
    chrome.storage.local.set({ [STORAGE_KEY]: prefs });
  }

  function getSelectedTypes() {
    return [...document.querySelectorAll(".opt:checked")].map(cb => cb.value);
  }

  function showFormError(message) {
    formError.textContent = message;
    formError.hidden = false;
  }

  function clearFormError() {
    formError.textContent = "";
    formError.hidden = true;
  }

  // ── Multi-domain tag system ──
  function addDomainTag(domain) {
    domain = domain.trim();
    if (!domain || domains.includes(domain)) return;
    domains.push(domain);
    domainInput.value = "";
    renderTags();
    updateDomainMeta();
    clearFormError();
    domainInput.focus();
    updateCookieCount();
  }

  function removeDomainTag(domain) {
    domains = domains.filter(d => d !== domain);
    renderTags();
    updateDomainMeta();
    updateCookieCount();
  }

  function renderTags() {
    domainTags.replaceChildren(...domains.map(d => {
      const tag = document.createElement("span");
      tag.className = "domain-tag";
      const label = document.createElement("span");
      label.className = "domain-tag-label";
      label.textContent = d;
      label.title = d;
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "domain-tag-remove";
      const removeLabel = tf("removeDomain", { d });
      removeBtn.setAttribute("aria-label", removeLabel);
      removeBtn.title = removeLabel;
      removeBtn.appendChild(cloneIcon("tplIconX"));
      removeBtn.addEventListener("click", () => removeDomainTag(d));
      tag.append(label, removeBtn);
      return tag;
    }));
  }

  function updateDomainMeta() {
    domainMeta.textContent = domains.length ? tf("domainCount", { n: domains.length }) : "";
  }

  // Cookie counter: total over tagged domains plus the domain being typed
  function updateCookieCount() {
    clearTimeout(cookieCountTimeout);
    cookieCountTimeout = setTimeout(async () => {
      const generation = ++cookieCountGeneration;
      const draft = domainInput.value.trim();
      const targets = [...new Set(draft ? [...domains, draft] : domains)];
      const counts = await Promise.all(targets.map(domain =>
        chrome.runtime.sendMessage({ action: "getCookieCount", domain })
          .then(res => res?.count || 0)
          .catch(e => {
            console.warn(`[popup] cookie count failed for ${domain}:`, e);
            return 0;
          })
      ));
      // A newer request started meanwhile: drop this stale result
      if (generation !== cookieCountGeneration) return;
      cookieCount = counts.reduce((sum, n) => sum + n, 0);
      renderCookieCount();
    }, 300);
  }

  function renderCookieCount() {
    cookieCountEl.hidden = cookieCount === 0;
    cookieCountEl.textContent = String(cookieCount);
    cookieCountEl.title = tf("cookiesFound", { n: cookieCount });
  }

  function updateTypeCount() {
    const checked = getSelectedTypes().length;
    typeCountEl.textContent = `${checked}/${typeCheckboxes.length}`;
    typeCountEl.classList.toggle("is-empty", checked === 0);
  }

  // ── Recent domains ──
  async function loadRecents() {
    const res = await chrome.runtime.sendMessage({ action: "getRecentDomains" }).catch(e => {
      console.warn("[popup] loading recent domains failed:", e);
      return null;
    });
    const recents = res?.recents || [];
    recentsWrapper.hidden = recents.length === 0;
    recentsList.replaceChildren(...recents.map(domain => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "recent-chip";
      chip.textContent = domain;
      chip.title = domain;
      chip.addEventListener("click", () => addDomainTag(domain));
      return chip;
    }));
    recentsList.scrollLeft = 0;
    recentsList.classList.toggle("is-overflowing", recentsList.scrollWidth > recentsList.clientWidth);
  }

  // ── Loader picker ──
  function renderLoader() {
    loaderBtns.forEach(b => {
      const active = b.dataset.loader === currentLoader;
      b.classList.toggle("active", active);
      b.setAttribute("aria-pressed", String(active));
    });
  }

  // ── Shortcut recorder ──
  function shortcutParts(sc) {
    const parts = [];
    if (sc.meta) parts.push(isMac ? "⌘" : "Win");
    if (sc.ctrl) parts.push(isMac ? "⌃" : "Ctrl");
    if (sc.alt) parts.push(isMac ? "⌥" : "Alt");
    if (sc.shift) parts.push(isMac ? "⇧" : "Shift");
    parts.push(sc.key.toUpperCase());
    return parts;
  }

  function renderKeys(container, sc) {
    container.replaceChildren(...shortcutParts(sc).map(part => {
      const kbd = document.createElement("kbd");
      kbd.textContent = part;
      return kbd;
    }));
  }

  function renderShortcut() {
    renderKeys(ctaShortcut, currentShortcut);
    renderKeys(shortcutKeys, currentShortcut);
    shortcutBtn.classList.toggle("recording", recording);
    shortcutHint.classList.toggle("is-active", recording);
    shortcutHint.textContent = recording ? (recordingError || t("pressKeys")) : t("shortcutHint");
  }

  function stopRecording() {
    recording = false;
    recordingError = "";
    renderShortcut();
  }

  // ── Results ──
  function typeLabel(type) {
    // Background reports subdomain passes as "<type> (subdomains)"
    const subdomainMatch = /^(\w+) \(subdomains\)$/.exec(type);
    if (subdomainMatch) return `${typeLabel(subdomainMatch[1])} (${t("subdomains")})`;
    if (type === "history") return t("history");
    if (type === "global") return t("globalError");
    return TYPE_LABELS[type] || type;
  }

  function showResults(resultsByDomain, allOk) {
    const all = resultsByDomain.flatMap(d => d.results);
    const okCount = all.filter(r => r.ok).length;
    const errCount = all.length - okCount;

    resultsBanner.classList.toggle("is-error", !allOk);
    resultsTitle.textContent = allOk ? t("success") : tf("resultsErr", { n: errCount });
    let sub = allOk ? tf("resultsSubOk", { n: okCount }) : tf("resultsSubErr", { ok: okCount, err: errCount });
    if (!allOk && autoReload.checked) sub += ` · ${t("notReloaded")}`;
    resultsSub.textContent = sub;

    resultsList.replaceChildren(...resultsByDomain.map(({ domain, results }, index) => {
      const failed = results.filter(r => !r.ok);
      const card = document.createElement("article");
      card.className = failed.length ? "result-card has-error" : "result-card";
      card.style.animationDelay = `${index * 50}ms`;

      const head = document.createElement("div");
      head.className = "result-head";
      const dot = document.createElement("span");
      dot.className = "result-dot";
      const name = document.createElement("span");
      name.className = "result-domain";
      name.textContent = domain;
      name.title = domain;
      const score = document.createElement("span");
      score.className = "result-score";
      score.textContent = `${results.length - failed.length}/${results.length}`;
      head.append(dot, name, score);

      const items = document.createElement("ul");
      items.className = "result-items";
      results.forEach(r => {
        const item = document.createElement("li");
        item.className = r.ok ? "result-item is-ok" : "result-item is-err";
        item.append(cloneIcon(r.ok ? "tplIconCheck" : "tplIconX"), typeLabel(r.type));
        items.appendChild(item);
      });
      card.append(head, items);

      failed.filter(r => r.error).forEach(r => {
        const error = document.createElement("p");
        error.className = "result-error";
        error.textContent = `${typeLabel(r.type)} — ${r.error}`;
        card.appendChild(error);
      });
      return card;
    }));

    showView("results");
    resultsBack.focus();
  }

  // ── Clearing ──
  function getTargetDomains() {
    // Add any remaining input as a domain
    const input = domainInput.value.trim();
    if (input && !domains.includes(input)) {
      addDomainTag(input);
    }
    return [...domains];
  }

  function setBusy(busy) {
    btn.disabled = busy;
    btn.setAttribute("aria-busy", String(busy));
    btnLabel.textContent = t(busy ? "clearing" : "clearBtn");
  }

  function executeClear() {
    const targetDomains = getTargetDomains();
    const types = getSelectedTypes();

    // Fire-and-forget: close popup immediately, background handles the rest
    if (autoClose.checked) {
      targetDomains.forEach(domain => {
        chrome.runtime.sendMessage({
          action: "clearDomain", domain, types,
          includeHttp: includeHttp.checked,
          includeSubdomains: includeSubdomains.checked,
          autoReload: autoReload.checked,
        });
      });
      window.close();
      return;
    }

    // Stay open: wait for results
    setBusy(true);
    clearFormError();

    const resultsByDomain = [];
    let completed = 0;

    targetDomains.forEach((domain, index) => {
      chrome.runtime.sendMessage({
        action: "clearDomain", domain, types,
        includeHttp: includeHttp.checked,
        includeSubdomains: includeSubdomains.checked,
        // Popup stays open: it handles the reload itself (below) to avoid a
        // double reload with the background handler
        autoReload: false,
      }, (res) => {
        // No results means the service worker failed before replying
        const results = !chrome.runtime.lastError && res?.results
          ? res.results
          : [{ type: "global", ok: false, error: t("noResponse") }];
        // Indexed so cards keep the input order whatever the response order
        resultsByDomain[index] = { domain, results };
        completed++;
        if (completed < targetDomains.length) return;

        const allOk = resultsByDomain.every(d => d.results.every(r => r.ok));
        setBusy(false);
        showResults(resultsByDomain, allOk);
        if (allOk) loadRecents();
        if (autoReload.checked && allOk && activeTabId) {
          // Navigate to the site root instead of reloading the current URL,
          // which could be a redirecting page (wp-admin/login, redirect loop)
          if (activeTabRootUrl) {
            chrome.tabs.update(activeTabId, { url: activeTabRootUrl });
          } else {
            chrome.tabs.reload(activeTabId);
          }
        }
      });
    });
  }

  function openConfirm(targetDomains, typeCount) {
    confirmText.textContent = tf("confirmText", { n: typeCount });
    confirmDomains.replaceChildren(...targetDomains.map(domain => {
      const chip = document.createElement("span");
      chip.className = "confirm-domain";
      chip.textContent = domain;
      chip.title = domain;
      return chip;
    }));
    confirmModal.hidden = false;
    confirmNo.focus();
  }

  function closeConfirm() {
    confirmModal.hidden = true;
    btn.focus();
  }

  // ── Init: saved preferences ──
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
        typeCheckboxes.forEach(cb => {
          cb.checked = prefs.types.includes(cb.value);
        });
      }
      if (prefs.shortcut) currentShortcut = prefs.shortcut;
      if (prefs.loaderStyle) currentLoader = prefs.loaderStyle;
      if (prefs.lang) currentLang = prefs.lang;
    }
  } catch (_) {}

  const { version } = chrome.runtime.getManifest();
  document.getElementById("versionTag").textContent = `v${version.split(".").slice(0, 2).join(".")}`;
  document.getElementById("versionFull").textContent = `Clear Domain Data ${version}`;

  langSelect.value = currentLang;
  applyLang();
  renderLoader();

  // ── Init: pre-fill with active tab domain and auto-detect protocol ──
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      const url = new URL(tab.url);
      if (url.hostname && !INTERNAL_PROTOCOLS.includes(url.protocol)) {
        domainInput.value = url.host; // host includes port if non-default
        activeTabId = tab.id;
        // Root URL of the active tab — used to reload to the site root after
        // clearing, avoiding redirecting pages (wp-admin/login, redirect loops)
        activeTabRootUrl = `${url.protocol}//${url.host}/`;
        if (url.protocol === "http:") {
          includeHttp.checked = true;
        }
      }
    }
  } catch (_) {}

  // Auto-focus and select domain input
  domainInput.focus();
  domainInput.select();

  // Add current tab domain as first tag if detected
  if (domainInput.value) {
    addDomainTag(domainInput.value);
  }

  updateCookieCount();
  loadRecents();

  // ── Listeners ──
  langSelect.addEventListener("change", () => {
    currentLang = langSelect.value;
    applyLang();
    savePrefs({ lang: currentLang });
  });

  [includeHttp, autoReload, autoClose, includeSubdomains, confirmClear, showNotification].forEach(el => {
    el.addEventListener("change", () => savePrefs());
  });

  typeCheckboxes.forEach(cb => cb.addEventListener("change", () => {
    savePrefs();
    updateTypeCount();
    clearFormError();
  }));

  document.getElementById("selectAll").addEventListener("click", () => {
    typeCheckboxes.forEach(cb => cb.checked = true);
    savePrefs();
    updateTypeCount();
    clearFormError();
  });

  document.getElementById("selectNone").addEventListener("click", () => {
    typeCheckboxes.forEach(cb => cb.checked = false);
    savePrefs();
    updateTypeCount();
  });

  addDomainBtn.addEventListener("click", () => {
    addDomainTag(domainInput.value);
  });

  domainInput.addEventListener("input", updateCookieCount);

  // Enter key: add tag if input has value, otherwise trigger clear
  domainInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      if (domainInput.value.trim()) {
        addDomainTag(domainInput.value);
      } else if (domains.length > 0) {
        btn.click();
      }
    }
    // Backspace on empty input removes last tag
    if (e.key === "Backspace" && !domainInput.value && domains.length > 0) {
      removeDomainTag(domains[domains.length - 1]);
    }
  });

  clearRecents.addEventListener("click", () => {
    chrome.storage.local.set({ recentDomains: [] });
    recentsWrapper.hidden = true;
  });

  // Mouse wheels only scroll vertically: map them onto the chip row
  recentsList.addEventListener("wheel", (e) => {
    if (recentsList.scrollWidth <= recentsList.clientWidth || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    recentsList.scrollLeft += e.deltaY;
    e.preventDefault();
  }, { passive: false });

  openSettings.addEventListener("click", () => {
    showView("settings");
    closeSettings.focus();
  });

  closeSettings.addEventListener("click", () => {
    stopRecording();
    showView("main");
    openSettings.focus();
  });

  resultsBack.addEventListener("click", () => {
    showView("main");
    btn.focus();
  });

  loaderBtns.forEach(loaderBtn => {
    loaderBtn.addEventListener("click", () => {
      currentLoader = loaderBtn.dataset.loader;
      renderLoader();
      savePrefs({ loaderStyle: currentLoader });
    });
  });

  shortcutBtn.addEventListener("click", () => {
    recording = true;
    recordingError = "";
    renderShortcut();
  });

  document.addEventListener("keydown", (e) => {
    if (!recording) return;
    // Ignore lone modifier keys
    if (["Meta", "Control", "Alt", "Shift"].includes(e.key)) return;

    e.preventDefault();
    e.stopPropagation();

    if (e.key === "Escape") {
      stopRecording();
      return;
    }

    // Require at least one modifier
    if (!e.metaKey && !e.ctrlKey && !e.altKey) {
      recordingError = t("addModifier");
      renderShortcut();
      return;
    }

    currentShortcut = {
      key: e.key.length === 1 ? e.key.toLowerCase() : e.key,
      meta: e.metaKey || false,
      ctrl: e.ctrlKey || false,
      shift: e.shiftKey || false,
      alt: e.altKey || false,
    };
    stopRecording();
    savePrefs({ shortcut: currentShortcut });
  }, true);

  // Cancel recording on click outside. composedPath() keeps the button even when
  // the clicked <kbd> was re-rendered (detached) by the button's own handler.
  document.addEventListener("click", (e) => {
    if (recording && !e.composedPath().includes(shortcutBtn)) {
      stopRecording();
    }
  });

  shortcutReset.addEventListener("click", () => {
    currentShortcut = DEFAULT_SHORTCUT;
    stopRecording();
    savePrefs({ shortcut: DEFAULT_SHORTCUT });
  });

  btn.addEventListener("click", () => {
    const targetDomains = getTargetDomains();
    if (targetDomains.length === 0) {
      showFormError(t("enterDomain"));
      domainInput.focus();
      return;
    }

    const types = getSelectedTypes();
    if (types.length === 0) {
      showFormError(t("selectType"));
      return;
    }

    if (confirmClear.checked) {
      openConfirm(targetDomains, types.length);
    } else {
      executeClear();
    }
  });

  confirmYes.addEventListener("click", () => {
    confirmModal.hidden = true;
    executeClear();
  });

  confirmNo.addEventListener("click", closeConfirm);
})();
