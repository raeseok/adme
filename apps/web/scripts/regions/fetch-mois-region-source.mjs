/**
 * Fetch MOIS jscode20260701 from official article page.
 * Saves to scripts/regions/source/ (gitignored).
 */
import { mkdir, writeFile } from "node:fs/promises";
import https from "node:https";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_DIR = path.join(__dirname, "source");
const ARTICLE_URL =
  "https://www.mois.go.kr/frt/bbs/type001/commonSelectBoardArticle.do?bbsId=BBSMSTR_000000000052&nttId=127039";

function fetchText(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml",
            "Accept-Language": "ko-KR,ko;q=0.9",
          },
        },
        (res) => {
          if (
            res.statusCode &&
            res.statusCode >= 300 &&
            res.statusCode < 400 &&
            res.headers.location &&
            redirects < 5
          ) {
            const next = res.headers.location.startsWith("http")
              ? res.headers.location
              : `https://www.mois.go.kr${res.headers.location}`;
            resolve(fetchText(next, redirects + 1));
            return;
          }
          const chunks = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () =>
            resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks).toString("utf8") }),
          );
        },
      )
      .on("error", reject);
  });
}

function downloadBinary(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Referer: ARTICLE_URL,
          },
        },
        (res) => {
          if (
            res.statusCode &&
            res.statusCode >= 300 &&
            res.statusCode < 400 &&
            res.headers.location &&
            redirects < 5
          ) {
            const next = res.headers.location.startsWith("http")
              ? res.headers.location
              : `https://www.mois.go.kr${res.headers.location}`;
            resolve(downloadBinary(next, redirects + 1));
            return;
          }
          const chunks = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () =>
            resolve({ status: res.statusCode ?? 0, data: Buffer.concat(chunks) }),
          );
        },
      )
      .on("error", reject);
  });
}

function extractDownloadLinks(html) {
  const links = [];
  const fileDownRegex =
    /FileDown\.do\?atchFileId=([^&"']+)(?:&amp;|&)fileSn=(\d+)/g;
  let m;
  while ((m = fileDownRegex.exec(html)) !== null) {
    links.push({ atchFileId: m[1], fileSn: m[2] });
  }
  const fnRegex =
    /fn_egov_downFile\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"](\d+)['"]\s*\)/g;
  while ((m = fnRegex.exec(html)) !== null) {
    links.push({ atchFileId: m[1], fileSn: m[2] });
  }
  const seen = new Set();
  return links.filter((l) => {
    const key = `${l.atchFileId}:${l.fileSn}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function sha256File(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function main() {
  await mkdir(SOURCE_DIR, { recursive: true });
  console.log(`INFO: fetching article ${ARTICLE_URL}`);
  const { status, body } = await fetchText(ARTICLE_URL);
  if (status !== 200) {
    throw new Error(`article fetch failed: HTTP ${status}`);
  }

  const links = extractDownloadLinks(body);
  console.log(`INFO: found ${links.length} download link(s)`);
  if (links.length === 0) {
    const snippet = body.slice(body.indexOf("jscode"), body.indexOf("jscode") + 500);
    console.error("DEBUG snippet:", snippet.slice(0, 300));
    throw new Error("no MOIS download links parsed — manual download required");
  }

  const target = links[0];
  const downloadUrl = `https://www.mois.go.kr/cmm/fms/FileDown.do?atchFileId=${encodeURIComponent(target.atchFileId)}&fileSn=${target.fileSn}`;
  console.log(`INFO: downloading zip (fileSn=${target.fileSn})`);

  const { status: dlStatus, data } = await downloadBinary(downloadUrl);
  if (dlStatus !== 200 || data.length < 100_000) {
    throw new Error(`download failed: HTTP ${dlStatus}, size=${data.length}`);
  }

  const zipPath = path.join(SOURCE_DIR, "jscode20260701.zip");
  await writeFile(zipPath, data);
  const sha256 = await sha256File(data);
  console.log(`PASS: saved ${zipPath} (${data.length} bytes)`);
  console.log(`INFO: sha256=${sha256}`);

  const manifest = {
    fetchedAt: new Date().toISOString(),
    provider: "mois-jscode",
    sourceKind: "mois-kikcd-h",
    effectiveDate: "2026-07-01",
    articleUrl: ARTICLE_URL,
    zipFile: zipPath,
    sha256,
    size: data.length,
    atchFileId: target.atchFileId,
    fileSn: target.fileSn,
  };
  await writeFile(
    path.join(SOURCE_DIR, "mois-source-manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8",
  );
  console.log("PASS: mois-source-manifest.json written");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
