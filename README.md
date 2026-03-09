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

| Data type | API |
|---|---|
| Network cache | `browsingData.removeCache()` |
| Cookies | `browsingData.removeCookies()` |
| localStorage | `browsingData.removeLocalStorage()` |
| IndexedDB | `browsingData.removeIndexedDB()` |
| Service Workers | `browsingData.removeServiceWorkers()` |
| Cache Storage (PWA) | `browsingData.removeCacheStorage()` |

Each type can be toggled individually via checkboxes.

## Features

- **Auto-detects** the active tab's domain (with protocol detection)
- **Manual input** — type any domain including `localhost` and IP addresses
- **Granular selection** — pick exactly which data types to clear
- **HTTP + HTTPS** support
- **Auto-reload** — optionally reloads the active tab after clearing
- **Per-item feedback** — see what succeeded and what failed
- **Dark mode** — follows your system theme
- **Keyboard friendly** — press Enter to submit
- **Parallel clearing** — all data types are cleared simultaneously
- **Secure** — strict CSP, input validation, no `innerHTML`
- **Lightweight** — zero dependencies, ~6KB total

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
2. The current tab's domain is pre-filled — edit it if needed
3. Check/uncheck the data types you want to clear
4. Click **"Clear selected data"**
5. Each item shows `[OK]` or `[ERR]` with details
6. The tab auto-reloads if the option is enabled

## Permissions

| Permission | Why |
|---|---|
| `browsingData` | Core functionality — clear domain-specific data |
| `tabs` | Read the active tab's URL to pre-fill the domain and reload |
| `host_permissions: <all_urls>` | Required by `browsingData` to target any origin |

**No data is collected, transmitted, or stored. Everything runs locally.**

## Project structure

```
clear-domain-data/
├── manifest.json      # Extension config (Manifest V3)
├── background.js      # Service worker — handles clearing logic
├── popup.html         # Popup UI with dark mode support
├── popup.js           # Popup logic
├── icons/
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
├── LICENSE
└── README.md
```

## Security

- Domain input validated against strict regex (supports domains, `localhost`, IPs)
- Data types validated against whitelist
- DOM updates use `textContent` / `createElement` — no `innerHTML`
- Content Security Policy: `script-src 'self'; object-src 'none'`
- Internal browser pages filtered out (`chrome://`, `edge://`, `about://`, etc.)
- No external requests, no analytics, no tracking

## License

[MIT](LICENSE)
