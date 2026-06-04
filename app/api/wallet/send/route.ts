import { NextResponse } from "next/server";
import { createCircleWalletsClient } from "@/lib/circleWallet";
import { normalizeAmount, normalizeEmail, isValidEmail } from "@/lib/money";
import { createSupabaseServerClient } from "@/lib/supabaseClient";
import { saveTransaction } from "@/lib/transactions";

export const runtime = "nodejs";

type SendBody = {
  senderEmail?: string;
  recipientEmail?: string;
  walletId?: string;
  destinationAddress?: string;
  amount?: string | number;
  tokenId?: string;
  note?: string;
  message?: string;
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

type UserRow = {
  id: string;
  email?: string | null;
};

type WalletRow = {
  circle_wallet_id?: string | null;
  wallet_id?: string | null;
  wallet_address?: string | null;
  address?: string | null;
};

async function findUserByEmail(email: string): Promise<UserRow | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("users")
    .select("id,email")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as UserRow | null;
}

async function findWalletByUserId(userId: string): Promise<WalletRow | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as WalletRow | null;
}

function getCircleTransactionId(data: unknown): string | null {
  const transaction = data as {
    id?: string;
    transaction?: {
      id?: string;
    };
  };

  return transaction.id ?? transaction.transaction?.id ?? null;
}

function getCircleTransactionState(data: unknown): string {
  const transaction = data as {
    state?: string;
    status?: string;
    transaction?: {
      state?: string;
      status?: string;
    };
  };

  return (
    transaction.state ??
    transaction.status ??
    transaction.transaction?.state ??
    transaction.transaction?.status ??
    "SUBMITTED"
  );
}

export async function POST(request: Request) {
  let body: SendBody;

  try {
    body = (await request.json()) as SendBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const senderEmail = normalizeEmail(body.senderEmail);
  const recipientEmail = normalizeEmail(body.recipientEmail);
  const legacyWalletId = body.walletId?.trim();
  const legacyDestinationAddress = body.destinationAddress?.trim();
  const amount = normalizeAmount(body.amount);
  const note = body.message?.trim() || body.note?.trim() || "";

  if (!amount) {
    return NextResponse.json(
      { error: "Enter an amount greater than 0." },
      { status: 400 }
    );
  }

  if (senderEmail || recipientEmail) {
    if (!isValidEmail(senderEmail) || !isValidEmail(recipientEmail)) {
      return NextResponse.json(
        { error: "Enter a valid sender and recipient email." },
        { status: 400 }
      );
    }

    if (senderEmail === recipientEmail) {
      return NextResponse.json(
        { error: "You cannot send money to yourself." },
        { status: 400 }
      );
    }
  } else if (!legacyWalletId || !legacyDestinationAddress) {
    return NextResponse.json(
      { error: "Missing recipient email or destination wallet." },
      { status: 400 }
    );
  }

  try {
    let walletId = legacyWalletId;
    let destinationAddress = legacyDestinationAddress;
    let sender: UserRow | null = null;
    let recipient: UserRow | null = null;

    if (senderEmail && recipientEmail) {
      const [senderUser, recipientUser] = await Promise.all([
        findUserByEmail(senderEmail),
        findUserByEmail(recipientEmail),
      ]);

      if (!senderUser) {
        return NextResponse.json(
          { error: "Your ARCLINK account could not be found. Log in again." },
          { status: 404 }
        );
      }

      if (!recipientUser) {
        return NextResponse.json(
          { error: "Recipient is not on ARCLINK yet. Ask them to sign up first." },
          { status: 404 }
        );
      }

      const [senderWallet, recipientWallet] = await Promise.all([
        findWalletByUserId(senderUser.id),
        findWalletByUserId(recipientUser.id),
      ]);

      walletId = senderWallet?.circle_wallet_id ?? senderWallet?.wallet_id ?? "";
      destinationAddress =
        recipientWallet?.wallet_address ?? recipientWallet?.address ?? "";
      sender = senderUser;
      recipient = recipientUser;

      if (!walletId) {
        return NextResponse.json(
          { error: "Your ARCLINK wallet is still being created. Try again soon." },
          { status: 409 }
        );
      }

      if (!destinationAddress) {
        return NextResponse.json(
          { error: "Recipient wallet is still being created. Try again soon." },
          { status: 409 }
        );
      }
    }

    if (!walletId || !destinationAddress) {
      return NextResponse.json(
        { error: "Could not resolve the sender or recipient wallet." },
        { status: 400 }
      );
    }

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
      refId: note || `ARCLINK payment to ${recipientEmail || "recipient"}`,
    });

    const circleData = transfer.data;
    const transactionId = getCircleTransactionId(circleData);
    const transactionState = getCircleTransactionState(circleData);
    const savedTransaction =
      sender && recipient
        ? await saveTransaction({
            senderUserId: sender.id,
            recipientUserId: recipient.id,
            senderEmail,
            recipientEmail,
            amount,
            message: note,
            status:
              transactionState.toLowerCase() === "failed"
                ? "failed"
                : "pending",
            transactionId,
            circleResponse: circleData,
          })
        : null;

    return NextResponse.json({
      success: true,
      transaction: circleData,
      savedTransaction,
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
