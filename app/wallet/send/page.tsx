"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import {
  getDynamicFallbackEmail,
  getDynamicFullName,
  getDynamicWalletAddress,
} from "@/lib/dynamicIdentity";

const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-950 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-400";

type WalletData = {
  wallet_id?: string | null;
  circle_wallet_id?: string | null;
};

type Receipt = {
  transactionId: string;
  state: string;
  recipient: string;
  amount: string;
  note: string;
  walletId: string;
  submittedAt: string;
};

export default function SendPage() {
  const router = useRouter();
  const { primaryWallet, sdkHasLoaded, user } = useDynamicContext();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [loading, setLoading] = useState(false);

  const dynamicWalletAddress = primaryWallet?.address ?? "";
  const email = useMemo(
    () => getDynamicFallbackEmail({ user, walletAddress: dynamicWalletAddress }),
    [dynamicWalletAddress, user]
  );
  const walletId = wallet?.wallet_id ?? wallet?.circle_wallet_id ?? "";

  const loadWallet = useCallback(async () => {
    setLoadingWallet(true);
    setError("");

    try {
      const response = await fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          full_name: getDynamicFullName(user),
          dynamic_user_id: user?.userId,
          dynamic_wallet_address: getDynamicWalletAddress({
            user,
            walletAddress: dynamicWalletAddress,
          }),
        }),
      });
      const result = (await response.json()) as {
        success?: boolean;
        error?: string;
        wallet?: WalletData;
      };

      if (!response.ok || !result.success || !result.wallet) {
        throw new Error(result.error ?? "Could not load wallet.");
      }

      setWallet(result.wallet);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load wallet.");
    } finally {
      setLoadingWallet(false);
    }
  }, [dynamicWalletAddress, email, user]);

  useEffect(() => {
    if (!sdkHasLoaded) {
      return;
    }

    if (!user && !primaryWallet) {
      router.replace("/auth");
      return;
    }

    const frame = requestAnimationFrame(() => {
      void loadWallet();
    });

    return () => cancelAnimationFrame(frame);
  }, [loadWallet, primaryWallet, router, sdkHasLoaded, user]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!recipient || !amount) {
      setError("Please enter recipient address and amount.");
      return;
    }

    if (!walletId) {
      setError("Wallet not loaded yet. Please wait and try again.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/wallet/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletId,
          destinationAddress: recipient,
          amount,
          note,
        }),
      });
      const result = (await response.json()) as {
        success?: boolean;
        error?: string;
        transaction?: {
          id?: string;
          state?: string;
        };
      };

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Transfer failed.");
      }

      setReceipt({
        transactionId: result.transaction?.id ?? "Pending Circle transaction",
        state: result.transaction?.state ?? "SUBMITTED",
        recipient,
        amount,
        note,
        walletId,
        submittedAt: new Date().toLocaleString(),
      });
      setMessage(
        `Transfer submitted${
          result.transaction?.id ? `: ${result.transaction.id}` : "."
        }`
      );
      setRecipient("");
      setAmount("");
      setNote("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transfer failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/85 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/85">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-xl font-black tracking-tight text-purple-700 transition hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300 sm:text-2xl"
          >
            ARCLINK
          </Link>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-bold text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Dashboard
          </button>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-sm font-bold uppercase tracking-wide text-purple-700 dark:text-purple-300">
            Send funds
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 dark:text-white">
            Send USDC
          </h1>
          <p className="mt-3 leading-7 text-zinc-700 dark:text-zinc-300">
            Transfer USDC from your Circle Arc Testnet wallet. You will get a
            receipt as soon as Circle accepts the transaction.
          </p>

          <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
            {loadingWallet
              ? "Loading wallet..."
              : walletId
                ? `Wallet ready: ${walletId}`
                : "Wallet not loaded"}
          </div>

          <div className="mt-6 grid gap-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-950">
              Network: <span className="text-zinc-950 dark:text-white">Arc Testnet</span>
            </div>
            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-950">
              Asset: <span className="text-zinc-950 dark:text-white">USDC</span>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSend}
          className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 sm:p-8"
        >
          <div className="space-y-5">
          <div>
            <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Recipient Address
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Amount (USDC)
            </label>
            <input
              type="number"
              min="0"
              step="0.000001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="50"
              className={`${inputClass} font-semibold tabular-nums`}
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Note (optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Website design payment"
              className={inputClass}
            />
          </div>
          </div>

          {error ? (
            <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </p>
          ) : null}

          {message ? (
            <p className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading || loadingWallet || !walletId}
            className="mt-5 w-full rounded-lg bg-zinc-950 py-3 font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {loading ? "Sending..." : "Send USDC"}
          </button>
        </form>

        {receipt ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/60 px-4 py-4 backdrop-blur-sm sm:items-center">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="receipt-title"
              className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900 sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                    Transaction submitted
                  </p>
                  <h2
                    id="receipt-title"
                    className="mt-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-white"
                  >
                    Receipt
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setReceipt(null)}
                  className="rounded-lg border border-zinc-300 px-3 py-1 text-sm font-bold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  aria-label="Close receipt"
                >
                  Close
                </button>
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <ReceiptRow label="Amount" value={`${receipt.amount} USDC`} />
                <ReceiptRow label="Status" value={receipt.state} />
                <ReceiptRow label="Submitted" value={receipt.submittedAt} />
                <ReceiptRow label="To" value={receipt.recipient} mono />
                <ReceiptRow label="Circle wallet" value={receipt.walletId} mono />
                <ReceiptRow label="Transaction ID" value={receipt.transactionId} mono />
                {receipt.note ? <ReceiptRow label="Note" value={receipt.note} /> : null}
              </div>

              <button
                type="button"
                onClick={() => setReceipt(null)}
                className="mt-6 w-full rounded-lg bg-purple-600 py-3 font-semibold text-white transition hover:bg-purple-500 dark:bg-purple-500 dark:hover:bg-purple-400"
              >
                Done
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function ReceiptRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-950">
      <p className="font-bold text-zinc-500 dark:text-zinc-400">{label}</p>
      <p
        className={`mt-1 break-all font-semibold text-zinc-950 dark:text-white ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
