// Content script: listen for keyboard shortcut and forward to background
const DEFAULT_SHORTCUT = { key: "x", meta: true, shift: true };
const STORAGE_KEY = "clearDomainPrefs";

let shortcut = DEFAULT_SHORTCUT;

// Load custom shortcut from storage
chrome.storage.local.get(STORAGE_KEY, (stored) => {
  const prefs = stored[STORAGE_KEY];
  if (prefs?.shortcut) shortcut = prefs.shortcut;
});

// Update shortcut when prefs change
chrome.storage.onChanged.addListener((changes) => {
  if (changes[STORAGE_KEY]?.newValue?.shortcut) {
    shortcut = changes[STORAGE_KEY].newValue.shortcut;
  }
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

// Overlay animation
let overlay = null;

function showOverlay(state) {
  removeOverlay();

  overlay = document.createElement("div");
  overlay.id = "__cdd_overlay";

  const icon = state === "success" ? "✓" : state === "error" ? "✗" : "";
  const spinner = state === "clearing"
    ? `<div class="__cdd_spinner"></div><div class="__cdd_text">Clearing…</div>`
    : `<div class="__cdd_icon __cdd_${state}">${icon}</div>`;

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
      }
      #__cdd_overlay .__cdd_spinner {
        width: 28px;
        height: 28px;
        border: 3px solid rgba(255, 77, 77, 0.2);
        border-top-color: #ff4d4d;
        border-radius: 50%;
        animation: __cdd_spin 0.7s linear infinite;
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
      @keyframes __cdd_spin {
        to { transform: rotate(360deg); }
      }
      @keyframes __cdd_fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes __cdd_fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      @keyframes __cdd_pop {
        0% { transform: scale(0.5); opacity: 0; }
        60% { transform: scale(1.15); }
        100% { transform: scale(1); opacity: 1; }
      }
    </style>
    <div class="__cdd_box">${spinner}</div>
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
    showOverlay(msg.state);
  }
});
