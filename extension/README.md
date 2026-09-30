# Wesite Browser Extension

Quick-save bookmarks to your Wesite library from any webpage.

## Install (Development)

1. Generate icons (requires the workspace `node_modules` with `sharp`):
   ```bash
   node extension/generate-icons.js
   ```

   Or manually place PNG icons at `icons/icon-16.png`, `icons/icon-48.png`, `icons/icon-128.png`.

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable **Developer mode** (top right)

4. Click **Load unpacked** and select the `extension/` folder

5. Click the Wesite icon in your toolbar and sign in — with email + password,
   or with **Continue with Google** (signs in on the Wesite website, then the
   extension adopts the session cookie — no password typing needed)

## Features

- **Quick Save** — Save the current page with one click
- **Library** — Browse every saved site inside the popup, filter by folder, and search by
  title, domain, or tag. Clicking a site opens it and records the visit.
- **Folders** — Choose which folder to save into
- **Tags** — Add tags inline (press Enter or comma)
- **Notes** — Add context notes to any bookmark
- **Favorites** — Star important pages
- **Recent** — View your recently saved bookmarks
- **Dark mode** — Toggle light/dark from the header. Defaults to your system setting.
- **Keyboard shortcut** — `Ctrl+Shift+S` (or `Cmd+Shift+S` on Mac) to save instantly
- **Logo** — Click the Wesite logo in the header to open the website in a tab

## Configuration

The extension talks to `http://localhost:3000` by default. To point it at a deployed
instance, set the stored URL from the service worker console or by editing
`DEFAULT_API_BASE` in `popup.js`:

```js
chrome.storage.local.set({ wesite_api_url: "https://wesite.app" });
```

The extension stores your auth token in `chrome.storage.local` and never sends it to third parties.
Your theme choice is stored under `wesite_theme` (`light`, `dark`, or `system`).

To support Google sign-in, the manifest also requests the `cookies` permission so the
extension can read the Wesite session cookie (`wesite_token`) after you sign in on the
website. `host_permissions` cover all `http://`/`https://` hosts so the popup and background
worker can call whichever Wesite URL you configure. After changing any file in this folder, reload the
extension from `chrome://extensions/` (click the refresh icon) for changes to take effect.

## API

The extension communicates with the Wesite API using Bearer token authentication. The token is obtained during login and stored securely in the browser's extension storage.

### Endpoints used:
- `POST /api/auth/token` — Sign in with email + password
- `POST /api/auth/google` — Verify a Google credential (website flow)
- `GET /api/auth/me` — Verify session
- `POST /api/websites` — Save a bookmark
- `GET /api/folders` — List folders for the folder picker and the Library tab
- `GET /api/websites?search=&folderId=&sort=` — Browse saved sites for the Library tab
- `POST /api/websites/:id/visit` — Record a visit when you open a site from the Library
