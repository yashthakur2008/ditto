const { chromium } = require("playwright");

const BASE = "https://frontend-tau-two-34.vercel.app";
const results = [];

function check(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? " :: " + detail : ""}`);
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  // 1. First-time visitor lands on welcome/onboarding path.
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  check("home loads", page.url().startsWith(BASE), page.url());

  // 2. Complete guest welcome -> preferences onboarding.
  await page.goto(`${BASE}/welcome`, { waitUntil: "networkidle" });
  await page.getByLabel(/first name/i).fill("Yash");
  await page.getByRole("button", { name: /continue as guest/i }).click();
  await page.waitForURL(/\/preferences/, { timeout: 15000 });
  check("new device routed to first-time preferences", /\/preferences/.test(page.url()), page.url());

  await page.getByRole("heading", { name: /how do you like to read/i }).waitFor({ timeout: 20000 });
  const firstTimeCopy = await page.getByText(/first time on this device/i).count();
  check("onboarding explains first-time setup", firstTimeCopy > 0);

  // 3. Step through onboarding to Appearance step.
  await page.getByLabel(/what should we call you|call you/i).first().fill("Yash");
  await page.getByLabel(/where are you reading from|country/i).first().fill("United States");
  await page.getByRole("option", { name: "United States" }).first().click();
  await page.getByRole("button", { name: /^Continue$/ }).click();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: /^Continue$/ }).click();
  await page.waitForTimeout(500);

  await page.getByRole("heading", { name: /appearance/i }).waitFor({ timeout: 20000 });
  const appearanceHeading = await page.getByRole("heading", { name: /appearance/i }).count();
  check("onboarding has appearance step", appearanceHeading > 0);

  // 4. Choose Dark in onboarding and verify live theme application.
  await page.getByRole("radio", { name: /dark/i }).check();
  await page.waitForTimeout(400);
  const themeAfterDark = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  check("dark selection applies data-theme=dark", themeAfterDark === "dark", String(themeAfterDark));

  await page.getByRole("button", { name: /^Continue$/ }).click();
  await page.getByRole("button", { name: /save and start chatting/i }).click();
  await page.waitForURL(/\/chat/, { timeout: 15000 });
  check("onboarding completes into chat", /\/chat/.test(page.url()), page.url());

  // 5. Theme persists across navigation/reload.
  await page.reload({ waitUntil: "networkidle" });
  const themePersisted = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  check("theme persists after reload", themePersisted === "dark", String(themePersisted));

  // 6. Chat shows typing then a response.
  await page.fill("#composer", "hello ditto");
  const typingSeen = page.waitForFunction(
    () => document.body.innerText.includes("Ditto is typing"),
    null,
    { timeout: 10000, polling: 16 },
  ).then(() => true).catch(() => false);
  await page.getByRole("button", { name: /^Send$/ }).click();
  const sawTyping = await typingSeen;
  check("chat shows typing indicator", sawTyping);

  await page.waitForFunction(
    () => {
      const items = [...document.querySelectorAll('ol[aria-label="Conversation with Ditto"] li')];
      const last = items[items.length - 1];
      return items.length >= 2 && last && !last.innerText.includes("Ditto is typing");
    },
    null,
    { timeout: 30000 },
  );
  const lastText = await page.evaluate(() => {
    const items = document.querySelectorAll('ol[aria-label="Conversation with Ditto"] li');
    return items[items.length - 1].innerText.trim();
  });
  check("chat returns a visible assistant response", lastText.length > 0, lastText.slice(0, 80));

  // 7. Settings page: API keys save locally.
  await page.goto(`${BASE}/settings`, { waitUntil: "networkidle" });
  check("settings shows API keys section", (await page.getByRole("heading", { name: /api keys/i }).count()) > 0);

  const openaiInput = page.getByLabel(/openai api key/i);
  await openaiInput.fill("sk-test-123");
  await page.waitForTimeout(400);
  const storedKeys = await page.evaluate(() => localStorage.getItem("ditto.api-keys.v1"));
  check("API key persists to local device storage", !!storedKeys && storedKeys.includes("sk-test-123"), String(storedKeys));

  const inputType = await openaiInput.getAttribute("type");
  check("API key input is masked", inputType === "password", String(inputType));

  // 8. Appearance switch in settings: Light and Auto.
  await page.getByRole("radio", { name: /^Light/ }).check();
  await page.waitForTimeout(300);
  const lightTheme = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  check("light selection applies data-theme=light", lightTheme === "light", String(lightTheme));

  await page.getByRole("radio", { name: /^Auto/ }).check();
  await page.waitForTimeout(300);
  const autoTheme = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  check("auto resolves to a concrete theme", autoTheme === "light" || autoTheme === "dark", String(autoTheme));

  // 9. Auto follows device preference (emulate dark device).
  const seed = (mode) => ({
    authed: true,
    onboardingComplete: true,
    preferences: { name: "Yash", country: "United States", age: null, reason: "", vision: [], hearing: [], dyslexia: "none", complexity: 3, childSafe: false, simplifyLanguage: false, textScale: 1.2, historyEnabled: false, themeMode: mode },
    source: null, analysis: null, intent: "", messages: [], rebuilt: null,
  });

  const darkCtx = await browser.newContext({ colorScheme: "dark" });
  await darkCtx.addInitScript((flow) => localStorage.setItem("ditto.flow.v1", JSON.stringify(flow)), seed("auto"));
  const darkPage = await darkCtx.newPage();
  await darkPage.goto(`${BASE}/settings`, { waitUntil: "networkidle" });
  await darkPage.getByRole("heading", { name: /api keys/i }).waitFor({ timeout: 20000 });
  const autoDark = await darkPage.evaluate(() => document.documentElement.getAttribute("data-theme"));
  check("auto follows dark device preference", autoDark === "dark", String(autoDark));

  // 10. Animation utilities actually applied in DOM.
  const motionCards = await darkPage.evaluate(() => document.querySelectorAll(".motion-card").length);
  check("animated cards render on settings", motionCards > 0, String(motionCards));

  const animName = await darkPage.evaluate(() => {
    const el = document.querySelector(".motion-card");
    return el ? getComputedStyle(el).animationName : null;
  });
  check("animation is active in browser", animName === "ditto-fade-up", String(animName));

  // 11. Reduced motion respected.
  const reducedCtx = await browser.newContext({ reducedMotion: "reduce" });
  await reducedCtx.addInitScript((flow) => localStorage.setItem("ditto.flow.v1", JSON.stringify(flow)), seed("light"));
  const reducedPage = await reducedCtx.newPage();
  await reducedPage.goto(`${BASE}/settings`, { waitUntil: "networkidle" });
  await reducedPage.getByRole("heading", { name: /api keys/i }).waitFor({ timeout: 20000 });
  const reducedDuration = await reducedPage.evaluate(() => {
    const el = document.querySelector(".motion-card");
    return el ? getComputedStyle(el).animationDuration : null;
  });
  check("reduced motion shortens animation", parseFloat(reducedDuration) <= 0.0001, String(reducedDuration));

  await browser.close();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} acceptance checks passed`);
  if (failed.length) process.exit(1);
})();
