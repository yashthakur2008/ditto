const input = document.getElementById("backendUrl");
const status = document.getElementById("status");

async function load() {
  const { backendUrl } = await getSettings();
  input.value = backendUrl;
}

async function save() {
  const url = input.value.trim().replace(/\/$/, "");
  if (!url) return;

  let origin;
  try {
    origin = new URL(url).origin + "/*";
  } catch {
    status.textContent = "That doesn't look like a valid URL.";
    status.style.color = "#a11";
    return;
  }

  // Request host permission for the new backend origin if we don't already
  // have it via the static host_permissions in manifest.json.
  const granted = await chrome.permissions.request({ origins: [origin] });
  if (!granted) {
    status.textContent =
      "Permission denied — Ditto needs access to this origin to call /transform.";
    status.style.color = "#a11";
    return;
  }

  const { profile } = await getSettings();
  await saveSettings({ backendUrl: url, profile });
  status.textContent = "Saved.";
  status.style.color = "#1a7f5a";
}

document.getElementById("save").addEventListener("click", save);
load();
