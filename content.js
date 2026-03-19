// Content script: listen for keyboard shortcut and forward to background
const DEFAULT_SHORTCUT = { key: "x", meta: true, shift: true };
const STORAGE_KEY = "clearDomainPrefs";

let shortcut = DEFAULT_SHORTCUT;
let loaderStyle = "spinner";

// Load preferences from storage
chrome.storage.local.get(STORAGE_KEY, (stored) => {
  const prefs = stored[STORAGE_KEY];
  if (prefs?.shortcut) shortcut = prefs.shortcut;
  if (prefs?.loaderStyle) loaderStyle = prefs.loaderStyle;
});

// Update when prefs change
chrome.storage.onChanged.addListener((changes) => {
  const prefs = changes[STORAGE_KEY]?.newValue;
  if (prefs?.shortcut) shortcut = prefs.shortcut;
  if (prefs?.loaderStyle) loaderStyle = prefs.loaderStyle;
});

document.addEventListener("keydown", (e) => {
  const match =
    e.key.toLowerCase() === shortcut.key.toLowerCase() &&
    e.metaKey === !!shortcut.meta &&
    e.ctrlKey === !!shortcut.ctrl &&
    e.shiftKey === !!shortcut.shift &&
    e.altKey === !!shortcut.alt;

  if (!match) return;

  e.preventDefault();
  e.stopPropagation();

  chrome.runtime.sendMessage({ action: "shortcutClear" });
}, true);

// ── i18n for loader texts ──

const LOADER_TEXTS = {
  en: { spinner: "Clearing…", pacman: "Eating data…", broom: "Sweeping…", matrix: "Purging…", nuke: "Nuking…", fire: "Burning data…", bounce: "Clearing…" },
  fr: { spinner: "Suppression…", pacman: "Miam miam…", broom: "Nettoyage…", matrix: "Purge…", nuke: "Destruction…", fire: "Ça brûle…", bounce: "Suppression…" },
  es: { spinner: "Borrando…", pacman: "Comiendo datos…", broom: "Barriendo…", matrix: "Purgando…", nuke: "Destruyendo…", fire: "Quemando…", bounce: "Borrando…" },
  de: { spinner: "Lösche…", pacman: "Frisst Daten…", broom: "Fegt…", matrix: "Bereinige…", nuke: "Zerstöre…", fire: "Verbrennt…", bounce: "Lösche…" },
  pt: { spinner: "Limpando…", pacman: "Comendo dados…", broom: "Varrendo…", matrix: "Purgando…", nuke: "Destruindo…", fire: "Queimando…", bounce: "Limpando…" },
};

function getLoaderText(style, lang) {
  return (LOADER_TEXTS[lang] || LOADER_TEXTS.en)[style] || LOADER_TEXTS.en[style] || "Clearing…";
}

// ── Loader definitions (functions returning HTML with translated text) ──

function getLoaders(lang) {
  const txt = (style) => getLoaderText(style, lang);
  return {
  spinner: {
    clearing: `<div class="__cdd_spinner"></div><div class="__cdd_text">${txt("spinner")}</div>`,
    css: `
      .__cdd_spinner {
        width: 28px; height: 28px;
        border: 3px solid rgba(255,77,77,0.2);
        border-top-color: #ff4d4d;
        border-radius: 50%;
        animation: __cdd_spin 0.7s linear infinite;
      }
      @keyframes __cdd_spin { to { transform: rotate(360deg); } }
    `,
  },

  pacman: {
    clearing: `
      <div class="__cdd_pacman_scene">
        <div class="__cdd_pacman"></div>
        <div class="__cdd_dots">
          <span></span><span></span><span></span><span></span><span></span><span></span>
        </div>
      </div>
      <div class="__cdd_text">${txt("pacman")}</div>
    `,
    css: `
      .__cdd_pacman_scene { display: flex; align-items: center; gap: 4px; height: 32px; }
      .__cdd_pacman {
        width: 28px; height: 28px;
        border-radius: 50%;
        background: #ffeb3b;
        position: relative;
        animation: __cdd_chomp 0.4s ease infinite;
      }
      .__cdd_pacman::before {
        content: '';
        position: absolute;
        top: 4px; left: 12px;
        width: 4px; height: 4px;
        background: #1a1a1a;
        border-radius: 50%;
      }
      @keyframes __cdd_chomp {
        0%, 100% { clip-path: polygon(100% 50%, 50% 0%, 0% 0%, 0% 100%, 50% 100%); }
        50% { clip-path: polygon(100% 50%, 50% 15%, 0% 0%, 0% 100%, 50% 85%); }
      }
      .__cdd_dots { display: flex; gap: 8px; align-items: center; }
      .__cdd_dots span {
        width: 6px; height: 6px;
        background: #ffeb3b;
        border-radius: 50%;
        animation: __cdd_dotEat 1.2s ease infinite;
      }
      .__cdd_dots span:nth-child(1) { animation-delay: 0s; }
      .__cdd_dots span:nth-child(2) { animation-delay: 0.15s; }
      .__cdd_dots span:nth-child(3) { animation-delay: 0.3s; }
      .__cdd_dots span:nth-child(4) { animation-delay: 0.45s; }
      .__cdd_dots span:nth-child(5) { animation-delay: 0.6s; }
      .__cdd_dots span:nth-child(6) { animation-delay: 0.75s; }
      @keyframes __cdd_dotEat {
        0%, 60% { opacity: 1; transform: scale(1); }
        80%, 100% { opacity: 0; transform: scale(0); }
      }
    `,
  },

  broom: {
    clearing: `
      <div class="__cdd_broom">🧹</div>
      <div class="__cdd_dust">
        <span>✦</span><span>✦</span><span>✦</span><span>✦</span><span>✦</span>
      </div>
      <div class="__cdd_text">${txt("broom")}</div>
    `,
    css: `
      .__cdd_broom {
        font-size: 40px;
        animation: __cdd_sweep 0.8s ease-in-out infinite;
      }
      @keyframes __cdd_sweep {
        0%, 100% { transform: rotate(-15deg); }
        50% { transform: rotate(15deg); }
      }
      .__cdd_dust {
        display: flex; gap: 6px; margin-top: -6px;
      }
      .__cdd_dust span {
        font-size: 10px; color: rgba(255,255,255,0.3);
        animation: __cdd_dustFloat 1s ease infinite;
      }
      .__cdd_dust span:nth-child(1) { animation-delay: 0s; }
      .__cdd_dust span:nth-child(2) { animation-delay: 0.2s; }
      .__cdd_dust span:nth-child(3) { animation-delay: 0.4s; }
      .__cdd_dust span:nth-child(4) { animation-delay: 0.6s; }
      .__cdd_dust span:nth-child(5) { animation-delay: 0.8s; }
      @keyframes __cdd_dustFloat {
        0% { opacity: 0.8; transform: translateY(0) scale(1); }
        100% { opacity: 0; transform: translateY(-16px) scale(0.5); }
      }
    `,
  },

  matrix: {
    clearing: `
      <div class="__cdd_matrix">
        <span>0</span><span>1</span><span>C</span><span>0</span><span>0</span>
        <span>K</span><span>1</span><span>E</span><span>0</span><span>1</span>
      </div>
      <div class="__cdd_text" style="color:#00e676;">${txt("matrix")}</div>
    `,
    css: `
      .__cdd_matrix {
        display: flex; gap: 4px; font-family: monospace;
        font-size: 18px; font-weight: 700; color: #00e676;
      }
      .__cdd_matrix span {
        animation: __cdd_matrixDrop 0.6s ease infinite;
        opacity: 0;
      }
      .__cdd_matrix span:nth-child(1) { animation-delay: 0s; }
      .__cdd_matrix span:nth-child(2) { animation-delay: 0.08s; }
      .__cdd_matrix span:nth-child(3) { animation-delay: 0.16s; }
      .__cdd_matrix span:nth-child(4) { animation-delay: 0.24s; }
      .__cdd_matrix span:nth-child(5) { animation-delay: 0.32s; }
      .__cdd_matrix span:nth-child(6) { animation-delay: 0.4s; }
      .__cdd_matrix span:nth-child(7) { animation-delay: 0.48s; }
      .__cdd_matrix span:nth-child(8) { animation-delay: 0.56s; }
      .__cdd_matrix span:nth-child(9) { animation-delay: 0.64s; }
      .__cdd_matrix span:nth-child(10) { animation-delay: 0.72s; }
      @keyframes __cdd_matrixDrop {
        0% { opacity: 0; transform: translateY(-12px); }
        30% { opacity: 1; transform: translateY(0); }
        70% { opacity: 1; }
        100% { opacity: 0; transform: translateY(8px); }
      }
    `,
  },

  nuke: {
    clearing: `
      <div class="__cdd_nuke">💥</div>
      <div class="__cdd_shockwave"></div>
      <div class="__cdd_text">${txt("nuke")}</div>
    `,
    css: `
      .__cdd_nuke {
        font-size: 48px;
        animation: __cdd_nukeShake 0.15s ease infinite alternate;
      }
      @keyframes __cdd_nukeShake {
        from { transform: translate(-2px, -1px) rotate(-1deg); }
        to { transform: translate(2px, 1px) rotate(1deg); }
      }
      .__cdd_shockwave {
        position: absolute;
        width: 60px; height: 60px;
        border: 2px solid rgba(255,77,77,0.4);
        border-radius: 50%;
        animation: __cdd_shockExpand 1.2s ease-out infinite;
      }
      @keyframes __cdd_shockExpand {
        0% { transform: scale(0.5); opacity: 1; }
        100% { transform: scale(4); opacity: 0; }
      }
    `,
  },

  fire: {
    clearing: `
      <div class="__cdd_fire">
        <span>🔥</span><span>🔥</span><span>🔥</span>
      </div>
      <div class="__cdd_text">${txt("fire")}</div>
    `,
    css: `
      .__cdd_fire { display: flex; gap: 2px; }
      .__cdd_fire span {
        font-size: 32px;
        animation: __cdd_flame 0.5s ease infinite alternate;
      }
      .__cdd_fire span:nth-child(1) { animation-delay: 0s; }
      .__cdd_fire span:nth-child(2) { animation-delay: 0.15s; }
      .__cdd_fire span:nth-child(3) { animation-delay: 0.3s; }
      @keyframes __cdd_flame {
        from { transform: translateY(0) scale(1); }
        to { transform: translateY(-6px) scale(1.15); }
      }
    `,
  },

  bounce: {
    clearing: `
      <div class="__cdd_bounce_dots">
        <span></span><span></span><span></span>
      </div>
      <div class="__cdd_text">${txt("bounce")}</div>
    `,
    css: `
      .__cdd_bounce_dots { display: flex; gap: 8px; }
      .__cdd_bounce_dots span {
        width: 12px; height: 12px;
        background: #ff4d4d;
        border-radius: 50%;
        animation: __cdd_bounce 0.6s ease infinite alternate;
      }
      .__cdd_bounce_dots span:nth-child(2) { animation-delay: 0.2s; background: #ffeb3b; }
      .__cdd_bounce_dots span:nth-child(3) { animation-delay: 0.4s; background: #00e676; }
      @keyframes __cdd_bounce {
        from { transform: translateY(0); }
        to { transform: translateY(-18px); }
      }
    `,
  },
};
}

// ── Overlay system ──

let overlay = null;

function showOverlay(state, style, lang) {
  removeOverlay();
  const loaders = getLoaders(lang || "en");
  const loader = loaders[style] || loaders.spinner;

  overlay = document.createElement("div");
  overlay.id = "__cdd_overlay";

  const icon = state === "success" ? "✓" : state === "error" ? "✗" : "";
  const content = state === "clearing"
    ? loader.clearing
    : `<div class="__cdd_icon __cdd_${state}">${icon}</div>`;

  const loaderCss = state === "clearing" ? (loader.css || "") : "";

  overlay.innerHTML = `
    <style>
      #__cdd_overlay {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        animation: __cdd_fadeIn 0.2s ease;
      }
      #__cdd_overlay .__cdd_box {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        padding: 24px 32px;
        background: rgba(12, 12, 14, 0.88);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        position: relative;
      }
      #__cdd_overlay .__cdd_text {
        font-family: -apple-system, system-ui, sans-serif;
        font-size: 13px;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.7);
        letter-spacing: 0.3px;
      }
      #__cdd_overlay .__cdd_icon {
        font-size: 32px;
        font-weight: 700;
        animation: __cdd_pop 0.3s ease;
      }
      #__cdd_overlay .__cdd_success { color: #00e676; }
      #__cdd_overlay .__cdd_error { color: #ff5252; }
      @keyframes __cdd_fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes __cdd_fadeOut { from { opacity: 1; } to { opacity: 0; } }
      @keyframes __cdd_pop {
        0% { transform: scale(0.5); opacity: 0; }
        60% { transform: scale(1.15); }
        100% { transform: scale(1); opacity: 1; }
      }
      ${loaderCss}
    </style>
    <div class="__cdd_box">${content}</div>
  `;

  document.documentElement.appendChild(overlay);

  if (state === "success" || state === "error") {
    setTimeout(removeOverlay, 1200);
  }
}

function removeOverlay() {
  if (!overlay) return;
  overlay.style.animation = "__cdd_fadeOut 0.2s ease forwards";
  const el = overlay;
  setTimeout(() => el.remove(), 200);
  overlay = null;
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "clearSessionStorage") {
    try { sessionStorage.clear(); } catch (_) {}
  }
  if (msg.action === "showOverlay") {
    showOverlay(msg.state, msg.loaderStyle || loaderStyle, msg.lang);
  }
});
