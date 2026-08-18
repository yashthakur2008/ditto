// Shared helpers used by popup.js, options.js, and results.js.
// Mirrors the profile shape the backend's TransformProfile schema expects
// (see app/models/schemas.py) and the defaults used by the web app.

const DEFAULT_BACKEND_URL = "http://localhost:8080";

const DEFAULT_PROFILE = {
  disability: "none",
  age: 30,
  country: "US",
  name: "",
  simplify_language: false,
  complexity: 3,
};

async function getSettings() {
  const stored = await chrome.storage.sync.get(["backendUrl", "profile"]);
  return {
    backendUrl: (stored.backendUrl || DEFAULT_BACKEND_URL).replace(/\/$/, ""),
    profile: { ...DEFAULT_PROFILE, ...(stored.profile || {}) },
  };
}

async function saveSettings({ backendUrl, profile }) {
  await chrome.storage.sync.set({ backendUrl, profile });
}
