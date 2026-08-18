# Ditto browser extension

A minimal Manifest V3 extension that calls the Ditto backend's `/transform`
endpoint on whatever tab is active, so you don't have to copy/paste links
into the web app.

## Load it (unpacked, for development)

1. Make sure the backend is running (`uvicorn app.main:app --reload --port 8080`
   from the repo root) and that `CORS_ORIGINS` allows this extension's origin
   — easiest for local dev is setting `CORS_ORIGINS=*` in `.env`.
2. Open `chrome://extensions`, enable **Developer mode**.
3. **Load unpacked** → select this `extension/` folder.
4. Click the Ditto icon on any `http(s)://` page, pick a profile, and hit
   **Rebuild this page**.

## Backend URL

Defaults to `http://localhost:8080`. To point at a deployed backend, open the
extension's **Backend settings** (link at the bottom of the popup, or via
`chrome://extensions` → Ditto → Details → Extension options) and enter its
URL — you'll be prompted to grant the extension permission for that origin.

## How it works

- `popup.js` reads the active tab's URL, POSTs it (plus your chosen profile)
  to `{backendUrl}/transform`, and stashes the response in
  `chrome.storage.local`.
- `results.html`/`results.js` opens in a new tab and renders the rebuilt HTML
  in a sandboxed iframe (`allow-scripts allow-same-origin`, same policy the
  web app uses), with a link back to the original page and the before/after
  accessibility score.
- Preferences (disability profile, simplify-language) and the backend URL
  persist in `chrome.storage.sync`.

No account, no content script, no page injection — the extension only reads
the current tab's URL via `activeTab` when you click the icon.
