/**
 * Stage 3-C — client components must not call Stage 3-B RPC directly
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  readText,
  walkFiles,
  isClientComponentFile,
} from "./utils/stage3c-helpers.mjs";

const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const RPC = "rpc_stage3b_dev_submit_quiz_reward_transaction";

function isAllowedServerPath(path) {
  if (!path.startsWith(join(WEB_ROOT, "src"))) {
    return path.startsWith(join(WEB_ROOT, "scripts"));
  }
  if (path.includes(`${join("app", "api")}`)) return true;
  if (path.includes("actions.ts")) return true;
  if (path.includes(join("lib", "quiz-rewards"))) return true;
  if (path.includes(join("lib", "stage3"))) return true;
  if (path.includes(join("scripts"))) return true;
  return false;
}

function main() {
  const srcRoot = join(WEB_ROOT, "src");
  const files = walkFiles(srcRoot);
  let clientDirectRpcCall = false;

  for (const file of files) {
    const source = readText(file);
    if (!source.includes(RPC)) continue;

    const isClient = isClientComponentFile(file, source);
    const allowed = isAllowedServerPath(file);

    if (isClient || (!allowed && file.endsWith(".tsx"))) {
      console.error(`FAIL: direct RPC reference in client/disallowed file: ${file}`);
      clientDirectRpcCall = true;
      continue;
    }

    if (!allowed) {
      console.error(`FAIL: RPC reference outside allowed server paths: ${file}`);
      clientDirectRpcCall = true;
    }
  }

  if (clientDirectRpcCall) {
    process.exit(1);
  }

  console.log("PASS: no client direct RPC calls");
  console.log("RESULT: clientDirectRpcCall=false");
  console.log("PASS: verify:stage3c-client-direct-rpc-guard");
}

main();
