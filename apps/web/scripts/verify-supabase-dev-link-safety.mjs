/**
 * Supabase dev link safety verification for dev-only migrations.
 * This script intentionally prints only project refs and safety results.
 */
import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = join(WEB_ROOT, "..", "..");
const SUPABASE_ROOT = join(REPO_ROOT, "supabase");
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

function loadLinkedRefFromMetadata() {
  const projectRefPath = join(SUPABASE_ROOT, ".temp", "project-ref");
  assert(existsSync(projectRefPath), "local Supabase project-ref metadata exists");
  return readText(projectRefPath);
}

function loadProjects() {
  const output = execSync("npx supabase projects list", {
    cwd: REPO_ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const jsonStart = output.indexOf("{");
  assert(jsonStart >= 0, "Supabase projects list returned JSON");
  return JSON.parse(output.slice(jsonStart)).projects;
}

function verifyLink() {
  const metadataRef = loadLinkedRefFromMetadata();
  assert(
    metadataRef === EXPECTED_DEV_REF,
    `linked ref matches expected dev ref ${EXPECTED_DEV_REF}`,
  );
  assert(
    metadataRef !== FORBIDDEN_PROD_REF,
    `linked ref is not forbidden prod ref ${FORBIDDEN_PROD_REF}`,
  );

  const projects = loadProjects();
  const dev = projects.find((project) => project.ref === EXPECTED_DEV_REF);
  const prod = projects.find((project) => project.ref === FORBIDDEN_PROD_REF);

  assert(Boolean(dev), `dev project exists ${EXPECTED_DEV_REF}`);
  assert(Boolean(prod), `prod project exists ${FORBIDDEN_PROD_REF}`);
  assert(dev.linked === true, `dev project linked=true ${EXPECTED_DEV_REF}`);
  assert(prod.linked === false, `prod project linked=false ${FORBIDDEN_PROD_REF}`);
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

function main() {
  verifyLink();
  verifyMigrationSafety();
  console.log(`RESULT: expectedDevRef=${EXPECTED_DEV_REF}`);
  console.log(`RESULT: forbiddenProdRef=${FORBIDDEN_PROD_REF}`);
  console.log(`RESULT: linkedRef=${EXPECTED_DEV_REF}`);
  console.log("PASS: verify:supabase-dev-link-safety");
}

main();
