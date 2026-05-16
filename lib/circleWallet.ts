import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

export type CreatedWallet = {
  id: string | undefined;
  address: string | undefined;
  blockchain: string | undefined;
  state: string | undefined;
};

function getCircleEnv() {
  const apiKey = process.env.CIRCLE_API_KEY?.trim();
  const entitySecret = process.env.CIRCLE_ENTITY_SECRET?.trim();
  const walletSetId = process.env.CIRCLE_WALLET_SET_ID?.trim();

  if (!apiKey) {
    throw new Error("Missing CIRCLE_API_KEY in .env.local");
  }
  if (!entitySecret) {
    throw new Error("Missing CIRCLE_ENTITY_SECRET in .env.local");
  }
  if (!walletSetId) {
    throw new Error(
      "Missing CIRCLE_WALLET_SET_ID. Save .env.local, then stop and restart `npm run dev`."
    );
  }

  return { apiKey, entitySecret, walletSetId };
}

export function createCircleWalletsClient() {
  const { apiKey, entitySecret } = getCircleEnv();

  return initiateDeveloperControlledWalletsClient({
    apiKey,
    entitySecret,
  });
}

function normalizeWallet(wallet: {
  id?: string;
  address?: string;
  blockchain?: string;
  state?: string;
}): CreatedWallet {
  return {
    id: wallet.id,
    address: wallet.address,
    blockchain: wallet.blockchain,
    state: wallet.state,
  };
}

export async function findCircleWalletForUser(
  userId: string
): Promise<{ walletSetId: string; wallets: CreatedWallet[] }> {
  const { walletSetId } = getCircleEnv();
  const client = createCircleWalletsClient();

  const walletsRes = await client.listWallets({
    walletSetId,
    refId: userId,
    blockchain: "ARC-TESTNET",
    pageSize: 1,
  });

  return {
    walletSetId,
    wallets: (walletsRes.data?.wallets ?? []).map(normalizeWallet),
  };
}

export async function createCircleWalletForUser(
  userId: string,
  email?: string
): Promise<{ walletSetId: string; wallets: CreatedWallet[] }> {
  const existing = await findCircleWalletForUser(userId);

  if (existing.wallets.length) {
    return existing;
  }

  const { walletSetId } = getCircleEnv();
  const client = createCircleWalletsClient();

  const walletsRes = await client.createWallets({
    walletSetId,
    blockchains: ["ARC-TESTNET"],
    count: 1,
    accountType: "SCA",
    idempotencyKey: userId,
    metadata: [
      {
        name: email ? `ARCLINK ${email}` : "ARCLINK user wallet",
        refId: userId,
      },
    ],
  });

  const wallets = (walletsRes.data?.wallets ?? []).map(normalizeWallet);

  return {
    walletSetId,
    wallets,
  };
}
