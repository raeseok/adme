/**
 * Supabase dev link safety verification for dev-only migrations.
 * This script intentionally prints only project refs and safety results.
 */
import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = join(WEB_ROOT, "..", "..");
const SUPABASE_ROOT = join(REPO_ROOT, "supabase");
const PRODUCTION_BASE =
  process.env.ADME_PRODUCTION_BASE_URL ?? "https://web-ashen-xi-52.vercel.app";
const EXPECTED_DEV_REF = "ogncvdxrrsjnwsuvgoyh";
const FORBIDDEN_PROD_REF = "vupsalteyltjqumppltc";
const STAGE3P_MIGRATION =
  "20260710110500_stage_3_p_dev_only_kyc_tax_terms_schema_foundation.sql";
const STAGE3Q_MIGRATION =
  "20260710131000_stage_3_q_cash_redemption_demo_state_machine.sql";

function readText(path) {
  return readFileSync(path, "utf8").trim();
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
  console.log(`PASS: ${message}`);
}

function normalizeDiagnosticsText(text) {
  return text.replace(/<!--\s*-->/g, "");
}

function extractMarkerValue(text, key) {
  const normalized = normalizeDiagnosticsText(text);
  const match = normalized.match(new RegExp(`${key}=([^\\s<"']+)`));
  return match?.[1] ?? "";
}

function runSupabaseCli(args) {
  const command = `npm exec --prefix apps/web -- supabase ${args.join(" ")}`;
  return execSync(command, {
    cwd: REPO_ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
    env: process.env,
  }).trim();
}

function loadAccessToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN?.trim()) {
    return process.env.SUPABASE_ACCESS_TOKEN.trim();
  }
  const candidates = [
    join(homedir(), ".supabase", "access-token"),
    join(process.env.APPDATA ?? "", "supabase", "access-token"),
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return readText(candidate);
    }
  }
  return "";
}

function loadLinkedRefFromMetadata() {
  const projectRefPath = join(SUPABASE_ROOT, ".temp", "project-ref");
  assert(existsSync(projectRefPath), "local Supabase project-ref metadata exists");
  return readText(projectRefPath);
}

function loadLinkedProjectMetadata() {
  const linkedProjectPath = join(SUPABASE_ROOT, ".temp", "linked-project.json");
  assert(existsSync(linkedProjectPath), "local Supabase linked-project metadata exists");
  return JSON.parse(readFileSync(linkedProjectPath, "utf8"));
}

function verifyCliSpawnPortable() {
  const version = runSupabaseCli(["--version"]);
  assert(Boolean(version), "Supabase CLI spawn succeeds via npm exec");
  assert(/^\d+\.\d+\.\d+/.test(version), "Supabase CLI version is readable");
}

function verifyLocalLinkMetadata() {
  const metadataRef = loadLinkedRefFromMetadata();
  const linkedProject = loadLinkedProjectMetadata();
  assert(
    metadataRef === EXPECTED_DEV_REF,
    `linked ref matches expected dev ref ${EXPECTED_DEV_REF}`,
  );
  assert(
    metadataRef !== FORBIDDEN_PROD_REF,
    `linked ref is not forbidden prod ref ${FORBIDDEN_PROD_REF}`,
  );
  assert(
    linkedProject.ref === EXPECTED_DEV_REF,
    `linked-project.json targets dev ref ${EXPECTED_DEV_REF}`,
  );
  assert(
    linkedProject.ref !== FORBIDDEN_PROD_REF,
    `linked-project.json does not target prod ref ${FORBIDDEN_PROD_REF}`,
  );
  assert(
    linkedProject.ref === metadataRef,
    "project-ref and linked-project.json refs match",
  );
}

async function verifyProjectHosts() {
  for (const ref of [EXPECTED_DEV_REF, FORBIDDEN_PROD_REF]) {
    const response = await fetch(`https://${ref}.supabase.co/rest/v1/`, {
      method: "GET",
      headers: { apikey: "public-anon-probe" },
    });
    assert(
      response.status === 401 || response.status === 200,
      `Supabase project host responds for ${ref}`,
    );
  }
  assert(
    EXPECTED_DEV_REF !== FORBIDDEN_PROD_REF,
    "dev and prod project-ref values differ",
  );
}

async function loadProjectsViaManagementApi(token) {
  const response = await fetch("https://api.supabase.com/v1/projects", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  assert(response.ok, "Supabase Management API projects list succeeded");
  const projects = await response.json();
  assert(Array.isArray(projects), "Supabase Management API returned project array");
  return projects;
}

function loadProjectsViaCli() {
  const output = runSupabaseCli(["projects", "list", "--output", "json"]);
  const parsed = JSON.parse(output);
  if (Array.isArray(parsed)) {
    return parsed;
  }
  if (Array.isArray(parsed.projects)) {
    return parsed.projects;
  }
  throw new Error("Supabase CLI projects list returned unexpected JSON shape");
}

async function verifyRemoteLinkState() {
  const token = loadAccessToken();
  if (token) {
    const projects = await loadProjectsViaManagementApi(token);
    verifyProjectsLinkedFlags(projects);
    return;
  }

  try {
    const projects = loadProjectsViaCli();
    verifyProjectsLinkedFlags(projects);
    return;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/Access token not provided|not logged in|authorization/i.test(message)) {
      console.log(
        "INFO: Supabase auth unavailable; verifying linked flags from local CLI metadata",
      );
      const metadataRef = loadLinkedRefFromMetadata();
      assert(
        metadataRef === EXPECTED_DEV_REF,
        `local CLI link implies dev linked=true ${EXPECTED_DEV_REF}`,
      );
      assert(
        metadataRef !== FORBIDDEN_PROD_REF,
        `local CLI link implies prod linked=false ${FORBIDDEN_PROD_REF}`,
      );
      return;
    }
    throw error;
  }
}

function verifyProjectsLinkedFlags(projects) {
  const dev = projects.find((project) => project.ref === EXPECTED_DEV_REF);
  const prod = projects.find((project) => project.ref === FORBIDDEN_PROD_REF);
  assert(Boolean(dev), `dev project exists ${EXPECTED_DEV_REF}`);
  assert(Boolean(prod), `prod project exists ${FORBIDDEN_PROD_REF}`);
  assert(dev.linked === true, `dev project linked=true ${EXPECTED_DEV_REF}`);
  assert(prod.linked === false, `prod project linked=false ${FORBIDDEN_PROD_REF}`);
}

async function verifyProductionRuntimeSeparation() {
  const response = await fetch(`${PRODUCTION_BASE}/admin/diagnostics`);
  assert(response.ok, "Production diagnostics responds for Supabase runtime check");
  const html = normalizeDiagnosticsText(await response.text());
  const currentRef = extractMarkerValue(html, "stage30CurrentSupabaseProjectRef");
  const separated = extractMarkerValue(html, "stage30DevProdSupabaseSeparated");
  const serviceRoleExposed = extractMarkerValue(html, "stage30ServiceRoleClientExposed");
  assert(
    currentRef === FORBIDDEN_PROD_REF,
    `Vercel Production uses prod ref ${FORBIDDEN_PROD_REF}`,
  );
  assert(currentRef !== EXPECTED_DEV_REF, "Vercel Production does not use dev ref");
  assert(separated === "true", "Production diagnostics reports dev/prod separation");
  assert(serviceRoleExposed === "false", "service role key is not exposed in diagnostics");
}

function verifyServiceRoleNotInPublicSource() {
  const targets = [join(WEB_ROOT, "src/components"), join(WEB_ROOT, "src/app")];
  for (const root of targets) {
    walkFiles(root, (filePath) => {
      const text = readFileSync(filePath, "utf8");
      assert(
        !/SUPABASE_SERVICE_ROLE_KEY\s*=/.test(text),
        `${filePath} does not assign SUPABASE_SERVICE_ROLE_KEY`,
      );
    });
  }
}

function walkFiles(dir, visit) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      walkFiles(fullPath, visit);
      continue;
    }
    visit(fullPath);
  }
}

function verifyMigrationSafety() {
  const migrationDir = join(SUPABASE_ROOT, "migrations");
  const stage3PFiles = readdirSync(migrationDir).filter((file) =>
    file.includes("stage_3_p_dev_only_kyc_tax_terms_schema_foundation"),
  );
  assert(
    stage3PFiles.length === 1 && stage3PFiles[0] === STAGE3P_MIGRATION,
    `exactly one Stage 3-P migration exists: ${STAGE3P_MIGRATION}`,
  );

  const sql = readText(join(migrationDir, STAGE3P_MIGRATION));
  for (const forbidden of [
    "DROP TABLE",
    "DROP COLUMN",
    "TRUNCATE",
    "DELETE FROM",
    "ALTER TABLE public.cash_redemption_requests",
    "INSERT INTO public.point_ledger",
    "UPDATE public.profiles",
    "UPDATE public.users",
    "CREATE TYPE",
    "migration repair",
    "db reset",
  ]) {
    assert(!sql.toUpperCase().includes(forbidden.toUpperCase()), `migration has no ${forbidden}`);
  }

  const stage3QFiles = readdirSync(migrationDir).filter((file) =>
    file.includes("stage_3_q_cash_redemption_demo_state_machine"),
  );
  if (stage3QFiles.length > 0) {
    assert(
      stage3QFiles.length === 1 && stage3QFiles[0] === STAGE3Q_MIGRATION,
      `exactly one Stage 3-Q migration exists: ${STAGE3Q_MIGRATION}`,
    );
    const stage3QSql = readText(join(migrationDir, STAGE3Q_MIGRATION));
    for (const forbidden of [
      "DROP TABLE",
      "DROP COLUMN",
      "TRUNCATE",
      "ALTER TABLE public.cash_redemption_requests",
      "INSERT INTO public.point_ledger",
      "UPDATE public.profiles",
      "UPDATE public.users",
      "CREATE TYPE",
      "migration repair",
      "db reset",
    ]) {
      assert(
        !stage3QSql.toUpperCase().includes(forbidden.toUpperCase()),
        `Stage 3-Q migration has no ${forbidden}`,
      );
    }

    const disallowedDeletes = stage3QSql
      .split(/\r?\n/)
      .filter((line) => line.toUpperCase().includes("DELETE FROM"))
      .filter((line) => !line.includes("public.cash_redemption_demo_"));
    assert(disallowedDeletes.length === 0, "Stage 3-Q DELETE only touches demo tables");
  }
}

async function main() {
  verifyCliSpawnPortable();
  verifyLocalLinkMetadata();
  await verifyProjectHosts();
  await verifyRemoteLinkState();
  await verifyProductionRuntimeSeparation();
  verifyServiceRoleNotInPublicSource();
  verifyMigrationSafety();
  console.log(`RESULT: expectedDevRef=${EXPECTED_DEV_REF}`);
  console.log(`RESULT: forbiddenProdRef=${FORBIDDEN_PROD_REF}`);
  console.log(`RESULT: linkedRef=${EXPECTED_DEV_REF}`);
  console.log(`RESULT: productionSupabaseRef=${FORBIDDEN_PROD_REF}`);
  console.log("PASS: verify:supabase-dev-link-safety");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
