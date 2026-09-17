<p align="center">
  <img src="icons/icon-128.png" alt="Clear Domain Data" width="128" />
</p>

<h1 align="center">Clear Domain Data</h1>

<p align="center">
  <strong>Chrome extension to clear all browsing data for a specific domain — without affecting anything else.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/manifest-v3-blue" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License" />
  <img src="https://img.shields.io/badge/chrome-%3E%3D109-orange" alt="Chrome 109+" />
  <img src="https://img.shields.io/badge/dependencies-0-brightgreen" alt="Zero dependencies" />
</p>

---

## Why?

When developing web apps, you often need to clear cached data for **one specific domain**:

- Redirect loops caused by cached 301s
- Stale Service Workers blocking new requests
- Corrupted cookies preventing login
- Outdated `localStorage` / `IndexedDB` breaking your app

Chrome's built-in "Clear browsing data" wipes **everything** across all domains. That's destructive when you're working on multiple projects.

**Clear Domain Data** lets you surgically clean a single domain in one click.

## What gets cleared

| Data type | How |
|---|---|
| Network cache | `browsingData.removeCache()` |
| Cookies | `browsingData.removeCookies()` |
| localStorage | `browsingData.removeLocalStorage()` |
| IndexedDB | `browsingData.removeIndexedDB()` |
| Service Workers | `browsingData.removeServiceWorkers()` |
| Cache Storage (PWA) | `browsingData.removeCacheStorage()` |
| sessionStorage | Content script, in the tab the clear was started from |
| History | `history.deleteUrl()` for URLs on that exact host |

Each type can be toggled individually.

## Features

- **Three ways to clear** — popup button, keyboard shortcut, or right-click → *Clear data for this domain*
- **Auto-detects** the active tab's domain, and includes the `http://` origin on http pages
- **Several domains at once** — add domains as tags, `localhost` and IP addresses with port included
- **Recent domains** — one click to add a domain you cleared before
- **Subdomains** — optionally removes cookies set on subdomains too
- **Auto-reload** — reloads the tab to the site root, so a redirecting page (e.g. a login) doesn't trap you
- **Auto-close** — the popup closes at once and the clear finishes in the background
- **Per-domain results** — when auto-close is off, see what succeeded and what failed
- **Customizable shortcut** — default `⌘ ⇧ X` on macOS (`Win + Shift + X` elsewhere)
- **Page animation** — seven loaders shown on the page while clearing
- **Optional confirmation** before popup clears, and **system notifications** after shortcut / context menu clears
- **5 languages** — English, French, Spanish, German, Portuguese
- **Light and dark themes** — follows your system
- **Works in tabs opened before an install or update** — the content script is injected again

## Installation

### From source (developer mode)

```bash
git clone https://github.com/pOwn3d/clear-domain-data.git
```

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **"Load unpacked"**
4. Select the `clear-domain-data` folder

### From release

1. Download the latest `.zip` from [Releases](https://github.com/pOwn3d/clear-domain-data/releases)
2. Extract it
3. Load it as unpacked extension (see steps above)

## Usage

1. Click the extension icon in your toolbar
2. The current tab's domain is pre-filled — add or remove domains if needed
3. Pick the data types to clear
4. Click **"Clear selected data"** (or press the shortcut shown on the button)

Language, confirmation, notifications, shortcut and page animation live in the **Settings** view (icon at the top right of the popup).

## Permissions

| Permission | Why |
|---|---|
| `browsingData` | Core functionality — clear domain-specific data |
| `cookies` | Count cookies for the domain and remove subdomain cookies |
| `history` | Clear the domain's history entries |
| `tabs` | Read the active tab's URL to pre-fill the domain, and reload it |
| `scripting` | Inject the content script into tabs already open when the extension is installed or updated |
| `contextMenus` | Right-click *Clear data for this domain* |
| `notifications` | Feedback after a shortcut or context menu clear |
| `storage` | Preferences and recent domains |
| `host_permissions: <all_urls>` | Target any origin with `browsingData`, and run the content script (shortcut, page animation, sessionStorage) |

**No data is collected or transmitted.** Preferences and recent domains stay in `chrome.storage.local`.

## Project structure

```
clear-domain-data/
├── manifest.json      # Extension config (Manifest V3)
├── background.js      # Service worker — clearing, shortcut, context menu, reload
├── content.js         # Keyboard shortcut, page animation, sessionStorage
├── popup.html         # Popup UI (light and dark themes)
├── popup.js           # Popup logic and translations
├── icons/
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   ├── icon-128.png
│   ├── icon.svg       # Source of the 48 and 128 px icons
│   └── icon-small.svg # Simplified source of the 16 and 32 px icons
├── LICENSE
└── README.md
```

## Security

- Domain input validated against strict regex (supports domains, `localhost`, IPs)
- Data types validated against whitelist
- Popup DOM built with `textContent` / `createElement` — user input is never inserted as HTML
- Content Security Policy: `script-src 'self'; object-src 'none'`
- Internal browser pages filtered out (`chrome://`, `edge://`, `about://`, etc.)
- No external requests, no analytics, no tracking

## License

[MIT](LICENSE)
