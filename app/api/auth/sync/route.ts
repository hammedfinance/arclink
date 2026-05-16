import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseClient";
import {
  getOrCreateUserWallet,
  serializeUserWallet,
} from "@/lib/userWallets";

export const runtime = "nodejs";

type SyncBody = {
  email?: string;
  full_name?: string;
  dynamic_user_id?: string;
  dynamic_wallet_address?: string;
};

type UserRow = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  username?: string | null;
  [key: string]: unknown;
};

function cleanEmail(email?: string): string {
  return email?.trim().toLowerCase() ?? "";
}

function cleanText(value?: string): string {
  return value?.trim() ?? "";
}

async function findUserByEmail(email: string): Promise<UserRow | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as UserRow | null;
}

async function createUser(
  email: string,
  fullName: string,
  dynamicUserId: string,
  dynamicWalletAddress: string
): Promise<UserRow> {
  const supabase = createSupabaseServerClient();
  const id = crypto.randomUUID();
  const basePayload = {
    id,
    email,
    full_name: fullName || null,
    dynamic_user_id: dynamicUserId || null,
    dynamic_wallet_address: dynamicWalletAddress || null,
  };

  const { data, error } = await supabase
    .from("users")
    .insert(basePayload)
    .select("*")
    .single();

  if (!error) {
    return data as UserRow;
  }

  const fallbackPayload = {
    id,
    email,
  };

  const fallback = await supabase
    .from("users")
    .insert(fallbackPayload)
    .select("*")
    .single();

  if (fallback.error) {
    throw new Error(error.message);
  }

  return fallback.data as UserRow;
}

async function updateUserMetadata(
  userId: string,
  fullName: string,
  dynamicUserId: string,
  dynamicWalletAddress: string
): Promise<void> {
  const metadata: Record<string, string | null> = {
    dynamic_user_id: dynamicUserId || null,
    dynamic_wallet_address: dynamicWalletAddress || null,
  };

  if (fullName) {
    metadata.full_name = fullName;
  }

  const supabase = createSupabaseServerClient();

  await supabase.from("users").update(metadata).eq("id", userId);
}

async function ensureUser(body: SyncBody): Promise<UserRow> {
  const email = cleanEmail(body.email);

  if (!email) {
    throw new Error("Dynamic user email is required to sync this account.");
  }

  const fullName = cleanText(body.full_name);
  const dynamicUserId = cleanText(body.dynamic_user_id);
  const dynamicWalletAddress = cleanText(body.dynamic_wallet_address);
  const existing = await findUserByEmail(email);

  if (existing) {
    await updateUserMetadata(
      existing.id,
      fullName,
      dynamicUserId,
      dynamicWalletAddress
    );
    return existing;
  }

  return createUser(email, fullName, dynamicUserId, dynamicWalletAddress);
}

export async function POST(request: Request) {
  let body: SyncBody;

  try {
    body = (await request.json()) as SyncBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const user = await ensureUser(body);
    const email = cleanEmail(user.email ?? body.email);
    const wallet = await getOrCreateUserWallet(user.id, email);

    return NextResponse.json({
      success: true,
      user,
      wallet: serializeUserWallet(wallet),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not sync user.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
