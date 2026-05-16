/**
 * Prints a new Circle Developer Controlled Wallets entity secret (hex).
 * Copy the printed line into CIRCLE_ENTITY_SECRET in .env.local, then run:
 *   npx tsx scripts/registerEntitySecret.ts
 *
 * Run: npx tsx scripts/generateCircleEntitySecret.ts
 */
import { generateEntitySecret } from "@circle-fin/developer-controlled-wallets";

generateEntitySecret();
