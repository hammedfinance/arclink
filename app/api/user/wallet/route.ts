import { NextResponse } from "next/server";
import {
  getOrCreateUserWallet,
  serializeUserWallet,
} from "@/lib/userWallets";

export const runtime = "nodejs";

type WalletBody = {
  userId?: string;
  email?: string;
};

export async function POST(request: Request) {
  let body: WalletBody;

  try {
    body = (await request.json()) as WalletBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const userId = body.userId?.trim();

  if (!userId) {
    return NextResponse.json(
      { error: "Missing userId" },
      { status: 400 }
    );
  }

  try {
    const wallet = await getOrCreateUserWallet(userId, body.email?.trim());

    return NextResponse.json({
      success: true,
      wallet: serializeUserWallet(wallet),
    });
  } catch (e: unknown) {
    const err = e as { message?: string; status?: number; code?: number };
    const message = err?.message ?? String(e);
    const status =
      typeof err?.status === "number" && err.status >= 400 && err.status < 600
        ? err.status
        : 502;

    return NextResponse.json(
      { error: message, code: err?.code },
      { status }
    );
  }
}
