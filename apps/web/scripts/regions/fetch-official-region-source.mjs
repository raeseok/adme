/**
 * Robust official source fetch — tries MOIS jscode, data.go.kr CSV, odcloud API page scrape.
 */
import { createHash } from "node:crypto";
import { mkdir, writeFile, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_DIR = path.join(__dirname, "source");

function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

async function saveDownload(download, fallbackName) {
  const suggested = download.suggestedFilename();
  const name = suggested && suggested.length > 3 ? suggested : fallbackName;
  const outPath = path.join(SOURCE_DIR, name);
  await download.saveAs(outPath);
  const buf = await readFile(outPath);
  return { outPath, buf, name };
}

async function tryMois(page) {
  const url =
    "https://www.mois.go.kr/frt/bbs/type001/commonSelectBoardArticle.do?bbsId=BBSMSTR_000000000052&nttId=127039";
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(2000);

  const html = await page.content();
  const hrefs = [...html.matchAll(/href="([^"]*commonDownload[^"]*jscode20260701[^"]*)"/gi)].map(
    (m) => m[1].replace(/&amp;/g, "&"),
  );

  for (const href of hrefs) {
    if (/말소|%EB%A7%90%EC%86%8C/i.test(href)) continue;
    const full = href.startsWith("http") ? href : `https://www.mois.go.kr${href}`;
    try {
      const resp = await page.request.get(full, { timeout: 120000 });
      if (!resp.ok()) continue;
      const buf = Buffer.from(await resp.body());
      if (buf.length < 100_000) continue;
      const outPath = path.join(SOURCE_DIR, "jscode20260701.zip");
      await writeFile(outPath, buf);
      return {
        provider: "mois-kikcd-b",
        sourceKind: "mois-jscode",
        effectiveDate: "2026-07-01",
        file: outPath,
        sha256: sha256(buf),
        size: buf.length,
        name: "jscode20260701.zip",
      };
    } catch {
      // next
    }
  }
  return null;
}

async function tryDataGoKr(page) {
  await page.goto("https://www.data.go.kr/data/15063424/fileData.do", {
    waitUntil: "domcontentloaded",
    timeout: 90000,
  });
  await page.waitForTimeout(3000);

  const html = await page.content();
  const fileIds = [...html.matchAll(/atchFileId=([^&"']+)/g)].map((m) => m[1]);
  const uniqueIds = [...new Set(fileIds)];

  for (const atchFileId of uniqueIds) {
    for (const fileSn of [1, 0, 2]) {
      const dlUrl = `https://www.data.go.kr/cmm/cmm/fileDownload.do?atchFileId=${atchFileId}&fileDetailSn=1&fileSn=${fileSn}`;
      try {
        const resp = await page.request.get(dlUrl, { timeout: 120000 });
        if (!resp.ok()) continue;
        const buf = Buffer.from(await resp.body());
        if (buf.length < 500_000) continue;
        const outPath = path.join(SOURCE_DIR, "molit_bjd_20260609.csv");
        await writeFile(outPath, buf);
        return {
          provider: "molit-bjd-csv",
          sourceKind: "molit-legal-dong",
          effectiveDate: "2026-06-09",
          file: outPath,
          sha256: sha256(buf),
          size: buf.length,
          name: "molit_bjd_20260609.csv",
        };
      } catch {
        // next
      }
    }
  }

  const downloadAnchors = page.locator("a").filter({ hasText: /다운로드|CSV|법정동/ });
  const count = await downloadAnchors.count();
  for (let i = 0; i < Math.min(count, 10); i++) {
    try {
      const [download] = await Promise.all([
        page.waitForEvent("download", { timeout: 30000 }),
        downloadAnchors.nth(i).click(),
      ]);
      const { outPath, buf, name } = await saveDownload(download, "molit_bjd_20260609.csv");
      if (buf.length < 500_000) continue;
      return {
        provider: "molit-bjd-csv",
        sourceKind: "molit-legal-dong",
        effectiveDate: "2026-06-09",
        file: outPath,
        sha256: sha256(buf),
        size: buf.length,
        name,
      };
    } catch {
      // next
    }
  }
  return null;
}

async function loadExistingSource() {
  const files = await readdir(SOURCE_DIR).catch(() => []);
  for (const name of files) {
    if (name.endsWith(".zip") && name.includes("jscode")) {
      const buf = await readFile(path.join(SOURCE_DIR, name));
      if (buf.length > 100_000) {
        return {
          provider: "mois-kikcd-b",
          sourceKind: "mois-jscode",
          effectiveDate: "2026-07-01",
          file: path.join(SOURCE_DIR, name),
          sha256: sha256(buf),
          size: buf.length,
          name,
        };
      }
    }
    if (name.endsWith(".csv") && (name.includes("bjd") || name.includes("법정"))) {
      const buf = await readFile(path.join(SOURCE_DIR, name));
      if (buf.length > 500_000) {
        return {
          provider: "molit-bjd-csv",
          sourceKind: "molit-legal-dong",
          effectiveDate: "2026-06-09",
          file: path.join(SOURCE_DIR, name),
          sha256: sha256(buf),
          size: buf.length,
          name,
        };
      }
    }
  }
  return null;
}

async function main() {
  await mkdir(SOURCE_DIR, { recursive: true });

  const existing = await loadExistingSource();
  if (existing) {
    console.log(`INFO: using existing source ${existing.name}`);
    await writeFile(
      path.join(SOURCE_DIR, "source-manifest.json"),
      JSON.stringify({ fetchedAt: new Date().toISOString(), ...existing }, null, 2),
    );
    console.log(`PASS: ${existing.name} sha256=${existing.sha256}`);
    return;
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  let result = await tryMois(page);
  if (!result) result = await tryDataGoKr(page);
  await browser.close();

  if (!result) {
    console.error("FAIL: official source download failed — manual download required");
    console.error("MANUAL: place jscode20260701.zip or molit_bjd_20260609.csv in scripts/regions/source/");
    process.exit(2);
  }

  await writeFile(
    path.join(SOURCE_DIR, "source-manifest.json"),
    JSON.stringify({ fetchedAt: new Date().toISOString(), ...result }, null, 2),
  );
  console.log(`PASS: ${result.name} (${result.size} bytes) sha256=${result.sha256}`);
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
