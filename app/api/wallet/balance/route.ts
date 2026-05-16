import { NextResponse } from "next/server";
import { createCircleWalletsClient } from "@/lib/circleWallet";

export const runtime = "nodejs";

type BalanceBody = {
  walletId?: string;
  address?: string;
};

type RpcResponse = {
  result?: string;
  error?: {
    message?: string;
  };
};

function formatNativeUsdc(hexBalance: string): string {
  const wei = BigInt(hexBalance);
  const base = BigInt(10) ** BigInt(18);
  const whole = wei / base;
  const fraction = wei % base;
  const fractionText = fraction.toString().padStart(18, "0").slice(0, 6);
  const trimmedFraction = fractionText.replace(/0+$/, "");

  return trimmedFraction ? `${whole}.${trimmedFraction}` : whole.toString();
}

async function getArcNativeBalance(address: string): Promise<string | null> {
  const rpcUrl =
    process.env.ARC_TESTNET_RPC_URL?.trim() || "https://rpc.testnet.arc.network";

  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_getBalance",
      params: [address, "latest"],
    }),
  });
  const data = (await response.json()) as RpcResponse;

  if (!response.ok || data.error || !data.result) {
    throw new Error(data.error?.message ?? "Could not load Arc native balance.");
  }

  return formatNativeUsdc(data.result);
}

export async function POST(request: Request) {
  let body: BalanceBody;

  try {
    body = (await request.json()) as BalanceBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const walletId = body.walletId?.trim();
  const address = body.address?.trim();

  if (!walletId && !address) {
    return NextResponse.json(
      { error: "Missing walletId or address" },
      { status: 400 }
    );
  }

  try {
    const [tokenBalances, nativeBalance] = await Promise.all([
      walletId
        ? createCircleWalletsClient()
            .getWalletTokenBalance({
              id: walletId,
              includeAll: true,
            })
            .then((balances) => balances.data?.tokenBalances ?? [])
        : Promise.resolve([]),
      address ? getArcNativeBalance(address) : Promise.resolve(null),
    ]);

    return NextResponse.json({
      success: true,
      balances: tokenBalances,
      nativeBalance,
      nativeSymbol: "USDC",
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
