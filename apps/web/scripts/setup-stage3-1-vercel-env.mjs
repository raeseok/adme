/**
 * One-time Stage 3-1 Vercel env setup — never logs secret values.
 * Usage: node scripts/setup-stage3-1-vercel-env.mjs
 */
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dirname, "..");
const repoRoot = join(webRoot, "../..");

const DEV_REF = "ogncvdxrrsjnwsuvgoyh";
const PROD_REF = "vupsalteyltjqumppltc";

function getAnonKey(ref) {
  const out = execSync(
    `npx supabase projects api-keys --project-ref ${ref} -o json`,
    { cwd: repoRoot, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] },
  );
  const parsed = JSON.parse(out);
  const keys = Array.isArray(parsed) ? parsed : (parsed.keys ?? []);
  const anon = keys.find((k) => k.id === "anon" || k.name === "anon");
  if (!anon?.api_key) {
    throw new Error(`anon key not found for ref ${ref}`);
  }
  return anon.api_key;
}

function setEnv(name, value, environment) {
  execSync(
    `npx vercel env add ${name} ${environment} --value ${JSON.stringify(value)} --force --yes --sensitive`,
    { cwd: webRoot, stdio: ["pipe", "pipe", "pipe"] },
  );
  console.log(`PASS: set ${name} for ${environment}`);
}

const devUrl = `https://${DEV_REF}.supabase.co`;
const prodUrl = `https://${PROD_REF}.supabase.co`;
const devAnon = getAnonKey(DEV_REF);
const prodAnon = getAnonKey(PROD_REF);

const shared = [
  ["ADME_EXPECTED_PROD_SUPABASE_REF", PROD_REF],
  ["ADME_EXPECTED_DEV_SUPABASE_REF", DEV_REF],
  ["ADME_POINT_LEDGER_ACTUAL_MUTATION_ENABLED", "false"],
  ["ADME_QUIZ_REWARD_ACTUAL_MUTATION_ENABLED", "false"],
  ["ADME_CAMPAIGN_BUDGET_ACTUAL_MUTATION_ENABLED", "false"],
];

for (const [name, value] of shared) {
  setEnv(name, value, "production");
  setEnv(name, value, "preview");
}

setEnv("NEXT_PUBLIC_SUPABASE_URL", prodUrl, "production");
setEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", prodAnon, "production");
setEnv("NEXT_PUBLIC_SUPABASE_URL", devUrl, "preview");
setEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", devAnon, "preview");

console.log("PASS: Stage 3-1 Vercel env configured (production=prod, preview=dev)");
console.log(`INFO: dev ref=${DEV_REF} prod ref=${PROD_REF}`);
