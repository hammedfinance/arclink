import { NextResponse } from "next/server";
import { createCircleWalletsClient } from "@/lib/circleWallet";

export const runtime = "nodejs";

type SendBody = {
  walletId?: string;
  destinationAddress?: string;
  amount?: string | number;
  tokenId?: string;
  note?: string;
};

type Balance = {
  amount: string;
  token?: {
    id?: string;
    symbol?: string;
  };
};

async function findUsdcTokenId(walletId: string): Promise<string | null> {
  const client = createCircleWalletsClient();
  const balances = await client.getWalletTokenBalance({
    id: walletId,
    includeAll: true,
  });
  const tokenBalances = (balances.data?.tokenBalances ?? []) as Balance[];
  const usdc = tokenBalances.find(
    (balance) => balance.token?.symbol?.toUpperCase() === "USDC"
  );

  return usdc?.token?.id ?? null;
}

export async function POST(request: Request) {
  let body: SendBody;

  try {
    body = (await request.json()) as SendBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const walletId = body.walletId?.trim();
  const destinationAddress = body.destinationAddress?.trim();
  const amount = String(body.amount ?? "").trim();
  const note = body.note?.trim();

  if (!walletId || !destinationAddress || !amount) {
    return NextResponse.json(
      { error: "Missing walletId, destinationAddress, or amount" },
      { status: 400 }
    );
  }

  if (Number.isNaN(Number(amount)) || Number(amount) <= 0) {
    return NextResponse.json(
      { error: "Amount must be greater than 0" },
      { status: 400 }
    );
  }

  try {
    const client = createCircleWalletsClient();
    const tokenId = body.tokenId?.trim() || (await findUsdcTokenId(walletId));

    if (!tokenId) {
      return NextResponse.json(
        { error: "Could not find a USDC token for this wallet" },
        { status: 400 }
      );
    }

    const transfer = await client.createTransaction({
      walletId,
      destinationAddress,
      amount: [amount],
      fee: {
        type: "level",
        config: {
          feeLevel: "MEDIUM",
        },
      },
      tokenId,
      idempotencyKey: crypto.randomUUID(),
      refId: note || "ARCLINK USDC transfer",
    });

    return NextResponse.json({
      success: true,
      transaction: transfer.data,
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
