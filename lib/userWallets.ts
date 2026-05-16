import { createSupabaseServerClient } from "@/lib/supabaseClient";
import {
  createCircleWalletForUser,
  type CreatedWallet,
} from "@/lib/circleWallet";

export type UserWalletRow = {
  id?: string;
  user_id: string;
  circle_wallet_id?: string | null;
  wallet_address?: string | null;
  wallet_id?: string | null;
  address?: string | null;
  blockchain?: string | null;
  state?: string | null;
  [key: string]: unknown;
};

export function normalizeUserWallet(wallet: {
  id?: string | null;
  address?: string | null;
  blockchain?: string | null;
  state?: string | null;
}): CreatedWallet {
  return {
    id: wallet.id ?? undefined,
    address: wallet.address ?? undefined,
    blockchain: wallet.blockchain ?? undefined,
    state: wallet.state ?? undefined,
  };
}

export async function getUserWallet(
  userId: string
): Promise<UserWalletRow | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as UserWalletRow | null;
}

async function ensureWalletOwnerUser(userId: string, email?: string) {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error(
      "Email is required before creating a wallet for this user. Please log in again."
    );
  }

  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from("users")
    .upsert({ id: userId, email: normalizedEmail }, { onConflict: "id" });

  if (!error) {
    return;
  }

  throw new Error(error.message);
}

export async function saveUserWallet(
  userId: string,
  wallet: CreatedWallet,
  email?: string
): Promise<UserWalletRow> {
  const existing = await getUserWallet(userId);

  if (existing) {
    return existing;
  }

  await ensureWalletOwnerUser(userId, email);

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("wallets")
    .insert({
      user_id: userId,
      circle_wallet_id: wallet.id ?? null,
      wallet_address: wallet.address ?? null,
      blockchain: wallet.blockchain ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as UserWalletRow;
}

export async function getOrCreateUserWallet(
  userId: string,
  email?: string
): Promise<UserWalletRow> {
  const existing = await getUserWallet(userId);

  if (existing) {
    return existing;
  }

  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error(
      "Email is required before creating a wallet for this user. Please log in again."
    );
  }

  const walletResult = await createCircleWalletForUser(userId, normalizedEmail);
  const wallet = walletResult.wallets[0];

  if (!wallet?.id) {
    throw new Error("Circle did not return a wallet for this user.");
  }

  return saveUserWallet(userId, wallet, normalizedEmail);
}

export function serializeUserWallet(wallet: UserWalletRow) {
  return {
    ...wallet,
    circle_wallet_id: wallet.circle_wallet_id ?? wallet.wallet_id,
    wallet_address: wallet.wallet_address ?? wallet.address,
    wallet_id: wallet.wallet_id ?? wallet.circle_wallet_id,
    address: wallet.address ?? wallet.wallet_address,
  };
}
