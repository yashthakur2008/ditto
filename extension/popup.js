const hostEl = document.getElementById("host");
const disabilityEl = document.getElementById("disability");
const simplifyEl = document.getElementById("simplify");
const rebuildBtn = document.getElementById("rebuild");
const statusEl = document.getElementById("status");
const optionsLink = document.getElementById("optionsLink");

optionsLink.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

let currentUrl = null;

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentUrl = tab?.url || null;

  if (!currentUrl || !/^https?:\/\//i.test(currentUrl)) {
    hostEl.textContent = "Open a regular web page to rebuild it.";
    rebuildBtn.disabled = true;
    return;
  }

  try {
    hostEl.textContent = new URL(currentUrl).host;
  } catch {
    hostEl.textContent = currentUrl;
  }

  const { profile } = await getSettings();
  disabilityEl.value = profile.disability;
  simplifyEl.checked = Boolean(profile.simplify_language);
}

async function rebuild() {
  if (!currentUrl) return;
  statusEl.textContent = "";
  rebuildBtn.disabled = true;
  rebuildBtn.textContent = "Rebuilding…";

  const { backendUrl, profile } = await getSettings();
  const updatedProfile = {
    ...profile,
    disability: disabilityEl.value,
    simplify_language: simplifyEl.checked,
  };
  await saveSettings({ backendUrl, profile: updatedProfile });

  try {
    const res = await fetch(`${backendUrl}/transform`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: currentUrl, profile: updatedProfile }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Backend returned ${res.status}. ${detail.slice(0, 200)}`);
    }

    const data = await res.json();
    await chrome.storage.local.set({
      dittoResult: {
        transformedHtml: data.transformed_html,
        originalUrl: currentUrl,
        beforeScore: data.before_score,
        afterScore: data.after_score,
        disability: updatedProfile.disability,
      },
    });

    await chrome.tabs.create({ url: chrome.runtime.getURL("results.html") });
    window.close();
  } catch (err) {
    statusEl.textContent =
      err instanceof Error
        ? `Couldn't reach Ditto — ${err.message}`
        : "Couldn't reach Ditto. Check the backend URL in settings.";
    rebuildBtn.disabled = false;
    rebuildBtn.textContent = "Rebuild this page";
  }
}

rebuildBtn.addEventListener("click", rebuild);
init();
