/**
 * Wrap Stage 1-F-R seed SQL into migration (UTF-8 safe).
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../../..");

async function main() {
  const seedPath = path.join(REPO_ROOT, "supabase/seed-data/regions/stage_1_f_r_regions_seed.sql");
  const seedSql = await readFile(seedPath, "utf8");
  const migrationPath = path.join(
    REPO_ROOT,
    "supabase/migrations/20260707210100_stage_1_f_r_regions_seed.sql",
  );
  const wrapped = `-- AdMe Stage 1-F-R: MOIS 2026.7.1 admin-dong canonical seed (generated)
-- Rollback: supabase/rollback/stage_1_f_r_regions_seed_rollback.sql

${seedSql}`;
  await writeFile(migrationPath, wrapped, "utf8");
  console.log(`PASS: wrote ${migrationPath}`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
