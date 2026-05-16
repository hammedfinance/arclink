/**
 * Create a Circle Developer Controlled Wallets wallet set and print its ID.
 *
 * Loads `.env` then `.env.local` from the repo root (same as registerEntitySecret).
 *
 * Run from repo root:
 *   npx tsx scripts/createWalletSet.ts
 *   npx tsx scripts/createWalletSet.ts "My wallet set name"
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

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
      `CIRCLE_API_KEY must be 3 colon-separated parts. Got ${parts.length}. See ${join(REPO_ROOT, ".env.local")}.`
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

const nameArg = process.argv.slice(2).join(" ").trim();
const setName =
  nameArg ||
  process.env.WALLET_SET_NAME?.trim() ||
  "ARCLINK wallets";

async function main() {
  console.log(`Creating wallet set: "${setName}"…\n`);

  const client = initiateDeveloperControlledWalletsClient({
    apiKey,
    entitySecret,
  });

  const response = await client.createWalletSet({ name: setName });
  const walletSet = response.data?.walletSet;

  if (!walletSet?.id) {
    console.error("Unexpected response:", JSON.stringify(response, null, 2));
    process.exit(1);
  }

  console.log("Wallet set created.");
  console.log(`  id:    ${walletSet.id}`);
  console.log(`  name:  ${setName}`);
  console.log();
  console.log("Add to .env.local (then restart `npm run dev`):");
  console.log(`CIRCLE_WALLET_SET_ID=${walletSet.id}`);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
