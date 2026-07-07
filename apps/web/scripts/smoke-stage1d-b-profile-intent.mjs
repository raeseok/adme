import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const profileForm = readFileSync(
  join(root, "src/app/consumer/profile/ConsumerProfileForm.tsx"),
  "utf8",
);
const consumerPage = readFileSync(
  join(root, "src/app/consumer/page.tsx"),
  "utf8",
);
const actions = readFileSync(
  join(root, "src/app/consumer/profile/actions.ts"),
  "utf8",
);
const diagnostics = readFileSync(
  join(root, "src/app/admin/diagnostics/page.tsx"),
  "utf8",
);
const pageData = readFileSync(
  join(root, "src/lib/consumer-profile/page-data.ts"),
  "utf8",
);
const completion = readFileSync(
  join(root, "src/lib/consumer-profile/completion.ts"),
  "utf8",
);
const regions = readFileSync(
  join(root, "src/lib/consumer-profile/regions.ts"),
  "utf8",
);

const requiredInProfile = [
  "출생년도",
  "성별",
  "주거지역 (시·군·구",
  "주활동지역 1 (시·군·구",
  "주활동지역 2 (시·군·구",
  "관심정보",
  "전체",
  "소비 의향 프로필 완성도",
  "INTEREST_SCOPE_ALL",
];

const forbiddenInProfile = [
  "소비 규모 범위",
  "SPEND_RANGE_OPTIONS",
  "stage1BRoute=",
  "stage1CProfileRoute",
  "stage1DSocialProvider",
  "stage1BSaveStatus=",
];

const requiredInConsumer = [
  "AdMe 소비자 홈",
  "소비 의향 프로필",
  "프로필 완성도",
  "프로필 작성하기",
  "프로필 수정하기",
  "광고 카드",
  "퀴즈",
  "포인트",
];

const requiredInActions = [
  "birth_year",
  "gender",
  "interest_scope",
  "INTEREST_SCOPE_ALL",
];

const forbiddenInActions = ["spendRange", "spendRangeToIntent"];

const requiredInDiagnostics = [
  "Stage 1-D-B Consumer Profile Intent UX",
  "stage-1-d-b-consumer-profile-intent-ux",
  "stage1DBProfileAxes=age,gender,region,interest",
  "stage1DBBirthYearEnabled=true",
  "stage1DBGenderEnabled=true",
  "stage1DBRegionGranularity=basic_municipality",
  "stage1DBProvinceOnlyOptionsVisible=false",
  "stage1DBSpendRangePublicUI=false",
  "stage1DBSpendRangeLegacyPreserved=true",
  "stage1DBInterestAllEnabled=true",
  "stage1DBProfileCompletionEnabled=true",
  "stage1DBConsumerHomeSkeleton=true",
  "stage1DBDeployCommit=",
];

const requiredInCompletion = ["computeProfileCompletion", "remainingLabels"];
const requiredInRegions = ["buildBasicMunicipalityOptions"];

let failed = 0;

function checkFile(label, source, required, forbidden = []) {
  for (const literal of required) {
    if (!source.includes(literal)) {
      console.error(`FAIL: ${label} missing: ${literal}`);
      failed++;
    } else {
      console.log(`PASS: ${label} — ${literal}`);
    }
  }
  for (const literal of forbidden) {
    if (source.includes(literal)) {
      console.error(`FAIL: ${label} should not contain: ${literal}`);
      failed++;
    } else {
      console.log(`PASS: ${label} clean — no ${literal}`);
    }
  }
}

checkFile("ConsumerProfileForm", profileForm, requiredInProfile, forbiddenInProfile);
checkFile("consumer page", consumerPage, requiredInConsumer);
checkFile("actions", actions, requiredInActions, forbiddenInActions);
checkFile("diagnostics", diagnostics, requiredInDiagnostics);
checkFile("page-data", pageData, ["buildBasicMunicipalityOptions"]);
checkFile("completion", completion, requiredInCompletion);
checkFile("regions", regions, requiredInRegions);

if (failed > 0) process.exit(1);
console.log("Stage 1-D-B profile intent smoke: all checks passed");
