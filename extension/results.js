async function init() {
  const { dittoResult } = await chrome.storage.local.get("dittoResult");
  const empty = document.getElementById("empty");
  const bar = document.getElementById("bar");
  const frame = document.getElementById("frame");

  if (!dittoResult || !dittoResult.transformedHtml) {
    empty.hidden = false;
    return;
  }

  const { transformedHtml, originalUrl, beforeScore, afterScore, disability } = dittoResult;

  let host = originalUrl;
  try {
    host = new URL(originalUrl).host;
  } catch {
    /* leave as-is */
  }

  document.getElementById("host").textContent = `${host} — rebuilt for ${disability}`;

  const before = beforeScore?.total;
  const after = afterScore?.total;
  document.getElementById("scores").textContent =
    typeof before === "number" && typeof after === "number"
      ? `Accessibility score: ${before} → ${after}`
      : "";

  const originalLink = document.getElementById("original");
  originalLink.href = originalUrl;

  bar.hidden = false;
  frame.srcdoc = transformedHtml;
  frame.hidden = false;
}

init();
