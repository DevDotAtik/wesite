# Wesite Browser Extension

Quick-save bookmarks to your Wesite library from any webpage.

## Install (Development)

1. Generate icons (requires Node.js with `canvas` package):
   ```bash
   cd extension
   npm install canvas
   node generate-icons.js
   ```

   Or manually place PNG icons at `icons/icon-16.png`, `icons/icon-48.png`, `icons/icon-128.png`.

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable **Developer mode** (top right)

4. Click **Load unpacked** and select the `extension/` folder

5. Click the Wesite icon in your toolbar and sign in

## Features

- **Quick Save** — Save the current page with one click
- **Folders** — Choose which folder to save into
- **Tags** — Add tags inline (press Enter or comma)
- **Notes** — Add context notes to any bookmark
- **Favorites** — Star important pages
- **Recent** — View your recently saved bookmarks
- **Keyboard shortcut** — `Ctrl+Shift+S` (or `Cmd+Shift+S` on Mac) to save instantly

## Configuration

On the login screen, set your **Wesite URL** (e.g., `https://wesite.app` or `http://localhost:3000`).

The extension stores your auth token in `chrome.storage.local` and never sends it to third parties.

The manifest includes `host_permissions` for all `http://`/`https://` hosts so the popup and background
worker can call whichever Wesite URL you configure. After changing any file in this folder, reload the
extension from `chrome://extensions/` (click the refresh icon) for changes to take effect.

## API

The extension communicates with the Wesite API using Bearer token authentication. The token is obtained during login and stored securely in the browser's extension storage.

### Endpoints used:
- `POST /api/auth/login` — Sign in
- `GET /api/auth/me` — Verify session
- `POST /api/websites` — Save a bookmark
- `GET /api/folders` — List folders for the folder picker
