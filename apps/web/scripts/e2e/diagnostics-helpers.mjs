/**
 * /admin/diagnostics marker loading — resilient to RSC hydration timing.
 */
const DEFAULT_MARKER_WAIT_MS = 20000;

function normalizeDiagnosticsText(text) {
  return text.replace(/<!--\s*-->/g, "");
}

export async function loadDiagnosticsFromHttp(baseUrl, options = {}) {
  const path = options.path ?? "/admin/diagnostics";
  const maxWaitMs = options.maxWaitMs ?? 45000;
  const deadline = Date.now() + maxWaitMs;
  let attempt = 0;

  while (Date.now() < deadline) {
    attempt += 1;
    const response = await fetch(`${baseUrl}${path}`);
    if (!response.ok) {
      throw new Error(`diagnostics HTTP ${response.status}`);
    }

    const html = normalizeDiagnosticsText(await response.text());
    const coverage = extractMarkerValue(html, "stage1FRegionSeedCoverage");
    const sources = {
      combined: html,
      textContent: html,
      innerText: html,
      html,
    };

    if (coverage === "full" || coverage === "adequate") {
      if (attempt > 1) {
        console.log(`INFO: diagnostics HTTP markers ready on attempt ${attempt}`);
      }
      return sources;
    }

    console.log(
      `INFO: diagnostics HTTP coverage=${coverage || "missing"}, retry ${attempt}`,
    );
    await new Promise((resolve) => setTimeout(resolve, 2500));
  }

  throw new Error("diagnostics coverage not ready within timeout");
}

export async function loadDiagnosticsSources(page, baseUrl, options = {}) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_MARKER_WAIT_MS;
  const path = options.path ?? "/admin/diagnostics";
  const retries = options.retries ?? 5;
  let lastSources = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    await page.goto(`${baseUrl}${path}`, { waitUntil: "domcontentloaded" });

    await page
      .waitForFunction(
        () => {
          const html = document.documentElement?.innerHTML ?? "";
          const text = document.body?.textContent ?? "";
          return (
            text.includes("DB check status") ||
            html.includes("stage1FRegionSeedCoverage=") ||
            html.includes("stage2ABuild=")
          );
        },
        { timeout: timeoutMs },
      )
      .catch(() => {
        // Fall through — HTML/RSC payload may still contain markers.
      });

    await page.waitForTimeout(1500);

    const textContent = normalizeDiagnosticsText(
      await page.evaluate(() => document.body?.textContent ?? ""),
    );
    const innerText = normalizeDiagnosticsText(await page.locator("body").innerText());
    const html = normalizeDiagnosticsText(await page.content());

    lastSources = {
      combined: `${textContent}\n${innerText}\n${html}`,
      textContent,
      innerText,
      html,
    };

    const coverage = extractMarkerValue(lastSources.combined, "stage1FRegionSeedCoverage");
    if (coverage === "full" || coverage === "adequate") {
      if (attempt > 1) {
        console.log(`INFO: diagnostics markers ready on attempt ${attempt}`);
      }
      return lastSources;
    }

    if (attempt < retries) {
      console.log(
        `INFO: diagnostics coverage=${coverage || "missing"}, retry ${attempt}/${retries}`,
      );
      await page.waitForTimeout(3000);
    }
  }

  try {
    const response = await fetch(`${baseUrl}${path}`);
    const fetchHtml = normalizeDiagnosticsText(await response.text());
    const fetchCoverage = extractMarkerValue(fetchHtml, "stage1FRegionSeedCoverage");
    if (fetchCoverage === "full" || fetchCoverage === "adequate") {
      console.log("INFO: diagnostics markers resolved via HTTP fetch fallback");
      return {
        combined: fetchHtml,
        textContent: fetchHtml,
        innerText: fetchHtml,
        html: fetchHtml,
      };
    }
  } catch {
    // Keep playwright snapshot for error reporting.
  }

  return lastSources ?? { combined: "", textContent: "", innerText: "", html: "" };
}

export function assertMarkerContains(combined, needle, label) {
  const normalizedCombined = normalizeDiagnosticsText(combined);
  if (normalizedCombined.includes(needle)) {
    console.log(`PASS: ${label} — ${needle}`);
    return;
  }

  const eqIdx = needle.indexOf("=");
  if (eqIdx > 0) {
    const key = needle.slice(0, eqIdx);
    const expected = needle.slice(eqIdx + 1);
    const actual = extractMarkerValue(normalizedCombined, key);
    if (actual === expected) {
      console.log(`PASS: ${label} — ${needle}`);
      return;
    }
  }

  throw new Error(`${label}: missing "${needle}"`);
}

export function assertMarkerList(combined, markers, label) {
  for (const marker of markers) {
    assertMarkerContains(combined, marker, label);
  }
}

/** Extract marker value from visible text or Next.js RSC flight payload. */
export function extractMarkerValue(combined, markerName) {
  const normalized = normalizeDiagnosticsText(combined);
  const patterns = [
    new RegExp(`${markerName}=<!--\\s*-->([a-zA-Z0-9_./ -]+?)(?:\\s|<|$|\\])`, "g"),
    new RegExp(`${markerName}=([a-zA-Z0-9_./ -]+?)(?:\\s|<|$|\\])`, "g"),
    new RegExp(`${markerName}=","([^"]+)"`, "g"),
    new RegExp(`\\["${markerName}=","([^"]+)"\\]`, "g"),
    new RegExp(`\\["${markerName}=",(\\d+)\\]`, "g"),
    new RegExp(`"children":\\["${markerName}=","([^"]+)"\\]`, "g"),
    new RegExp(`"children":\\["${markerName}=",(\\d+)\\]`, "g"),
  ];

  const values = [];
  for (const pattern of patterns) {
    for (const match of normalized.matchAll(pattern)) {
      if (match?.[1] != null && String(match[1]).trim() !== "") {
        values.push(String(match[1]).trim());
      }
    }
  }

  if (values.length === 0) return "";

  const preference = ["full", "adequate", "true", "partial", "unknown"];
  for (const preferred of preference) {
    const hit = values.find((value) => value === preferred);
    if (hit) return hit;
  }

  return values[values.length - 1];
}
