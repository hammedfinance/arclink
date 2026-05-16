/**
 * Register Circle Developer Controlled Wallets entity secret.
 * Run: npx tsx scripts/registerEntitySecret.ts
 *
 * Loads `.env` then `.env.local` from the repo root (parent of this folder).
 * Keys in `.env.local` override the process environment so a stale Windows
 * `CIRCLE_API_KEY` cannot override your file.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { registerEntitySecretCiphertext } from "@circle-fin/developer-controlled-wallets";

const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

function parseEnvFile(src: string): Record<string, string> {
  const out: Record<string, string> = {};
  const text = src.replace(/^\uFEFF/, "");
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim().replace(/^\uFEFF/, "");
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function mergeEnvFile(absPath: string, overrideExisting: boolean) {
  if (!existsSync(absPath)) return;
  const parsed = parseEnvFile(readFileSync(absPath, "utf8"));
  for (const [k, v] of Object.entries(parsed)) {
    if (overrideExisting || process.env[k] === undefined) {
      process.env[k] = v;
    }
  }
}

function normalizeCircleApiKey(raw: string): string {
  const s = raw.replace(/^\uFEFF/, "").trim();
  const parts = s.split(":").map((p) => p.trim());
  if (parts.length !== 3 || parts.some((p) => !p)) {
    console.error(
      `CIRCLE_API_KEY must be exactly 3 colon-separated parts (TEST_API_KEY or LIVE_API_KEY : id : secret). Got ${parts.length} part(s). Check: ${join(REPO_ROOT, ".env.local")} (save as UTF-8, one line, no spaces around "=").`
    );
    process.exit(1);
  }
  return parts.join(":");
}

mergeEnvFile(join(REPO_ROOT, ".env"), false);
mergeEnvFile(join(REPO_ROOT, ".env.local"), true);

const apiKeyRaw = process.env.CIRCLE_API_KEY ?? "";
const entitySecretRaw = process.env.CIRCLE_ENTITY_SECRET ?? "";

if (!apiKeyRaw.trim() || !entitySecretRaw.trim()) {
  console.error(
    `Missing CIRCLE_API_KEY or CIRCLE_ENTITY_SECRET in ${join(REPO_ROOT, ".env.local")}`
  );
  process.exit(1);
}

const apiKey = normalizeCircleApiKey(apiKeyRaw);
const entitySecret = entitySecretRaw.replace(/^\uFEFF/, "").trim();

const recoveryDir = join(REPO_ROOT, "scripts");

(async () => {
  if (!existsSync(recoveryDir)) mkdirSync(recoveryDir, { recursive: true });

  console.log("Registering entity secret with Circle…");

  try {
    const response = await registerEntitySecretCiphertext({
      apiKey,
      entitySecret,
      recoveryFileDownloadPath: recoveryDir,
    });

    const recovery = response.data?.recoveryFile ?? "";
    if (recovery) {
      writeFileSync(
        join(recoveryDir, `recovery_file_${Date.now()}.dat`),
        recovery
      );
    }
    console.log("Done. Store recovery_file_*.dat under ./scripts securely.");
  } catch (e: unknown) {
    const err = e as { message?: string; code?: number; status?: number };
    const msg = err?.message ?? String(e);
    console.error(msg);
    if (
      /malformed API key/i.test(msg) ||
      err?.code === 401 ||
      err?.status === 401
    ) {
      console.error(`
Circle returned 401. If your .env.local line already looks like:
  TEST_API_KEY:xxxxxxxx:yyyyyyyy
then the id/secret may be wrong or revoked — create a new Web3 Services API key in https://console.circle.com and replace the line (UTF-8 file).

Entity secret must come from Circle SDK generateEntitySecret(), not a random string from generate-secret.ts.
`);
    }
    process.exit(1);
  }
})();
