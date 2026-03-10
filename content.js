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
