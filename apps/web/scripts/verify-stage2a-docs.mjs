/**
 * Stage 2-A — required documentation exists with mandatory phrases
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

const DOCS = [
  {
    path: join(repoRoot, "docs/adme-stage-2a-readonly-ad-quiz-audit.md"),
    required: [
      "point_ledger",
      "mutation",
      "quiz_answer",
      "ad_views",
      "Stage 2-B",
    ],
  },
  {
    path: join(repoRoot, "docs/adme-kakao-notification-feasibility.md"),
    required: [
      "카카오톡",
      "실제 발송 없음",
      "수신 동의",
      "수신거부",
      "소비 의향 프로필",
      "연락수단",
      "Stage 2-D",
      "Stage 5-K",
      "알림톡",
    ],
  },
  {
    path: join(repoRoot, "docs/adme-stage-2-roadmap.md"),
    required: [
      "Stage 2-A",
      "Stage 2-B",
      "Stage 2-C",
      "Stage 2-D",
      "Stage 5-K",
      "point_ledger",
      "quiz_answer",
      "카카오톡 알림 기능은 광고 도착 알림이며",
      "서버 권위",
    ],
  },
];

let failed = 0;

for (const doc of DOCS) {
  if (!existsSync(doc.path)) {
    console.error(`FAIL: missing ${doc.path}`);
    failed++;
    continue;
  }
  const content = readFileSync(doc.path, "utf8");
  console.log(`PASS: exists ${doc.path}`);

  for (const phrase of doc.required) {
    if (!content.includes(phrase)) {
      console.error(`FAIL: ${doc.path} missing phrase "${phrase}"`);
      failed++;
    } else {
      console.log(`PASS: ${doc.path} — "${phrase}"`);
    }
  }
}

if (failed > 0) {
  process.exit(1);
}
console.log("PASS: verify:stage2a-docs");
