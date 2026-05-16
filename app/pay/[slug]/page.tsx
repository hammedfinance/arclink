"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useParams } from "next/navigation";
import { DynamicWidget, useDynamicContext } from "@dynamic-labs/sdk-react-core";
import {
  getDynamicFallbackEmail,
  getDynamicFullName,
  getDynamicWalletAddress,
} from "@/lib/dynamicIdentity";

type PaymentLink = {
  slug: string;
  title: string;
  amount: string | number;
  status?: string | null;
};

type WalletData = {
  wallet_id?: string | null;
  circle_wallet_id?: string | null;
  address?: string | null;
  wallet_address?: string | null;
};

type UserData = {
  email?: string | null;
  full_name?: string | null;
  username?: string | null;
};

type PaymentReceipt = {
  transactionId: string;
  amount: string | number;
  recipient: string;
  submittedAt: string;
};

export default function PaymentCheckoutPage() {
  const params = useParams();
  const { primaryWallet, sdkHasLoaded, user } = useDynamicContext();
  const [paymentLink, setPaymentLink] = useState<PaymentLink | null>(null);
  const [freelancer, setFreelancer] = useState<UserData | null>(null);
  const [freelancerWallet, setFreelancerWallet] = useState<WalletData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);

  const slug = typeof params.slug === "string" ? params.slug : "";
  const dynamicWalletAddress = primaryWallet?.address ?? "";
  const email = useMemo(
    () => getDynamicFallbackEmail({ user, walletAddress: dynamicWalletAddress }),
    [dynamicWalletAddress, user]
  );
  const walletAddress =
    freelancerWallet?.address ??
    freelancerWallet?.wallet_address ??
    "0x0000000000000000000000000000000000000000";
  const freelancerName =
    freelancer?.username ||
    freelancer?.full_name ||
    freelancer?.email ||
    "ARCLINK freelancer";

  const loadPayment = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/payments/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const result = (await response.json()) as {
        success?: boolean;
        error?: string;
        paymentLink?: PaymentLink;
        user?: UserData;
        wallet?: WalletData;
      };

      if (!response.ok || !result.success || !result.paymentLink) {
        throw new Error(result.error ?? "Could not load payment link.");
      }

      setPaymentLink(result.paymentLink);
      setFreelancer(result.user ?? null);
      setFreelancerWallet(result.wallet ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load payment link.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) {
      const frame = requestAnimationFrame(() => {
        void loadPayment();
      });

      return () => cancelAnimationFrame(frame);
    }
  }, [loadPayment, slug]);

  async function copyAddress() {
    await navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function payNow() {
    if (!paymentLink) {
      return;
    }

    setPaying(true);
    setError("");
    setMessage("");

    try {
      const syncResponse = await fetch("/api/auth/sync", {
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
      const sync = (await syncResponse.json()) as {
        success?: boolean;
        error?: string;
        wallet?: WalletData;
      };

      if (!syncResponse.ok || !sync.success || !sync.wallet) {
        throw new Error(sync.error ?? "Could not load payer wallet.");
      }

      const payerWalletId = sync.wallet.wallet_id ?? sync.wallet.circle_wallet_id;

      if (!payerWalletId) {
        throw new Error("Payer wallet is missing Circle wallet ID.");
      }

      const sendResponse = await fetch("/api/wallet/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletId: payerWalletId,
          destinationAddress: walletAddress,
          amount: paymentLink.amount,
          note: `ARCLINK payment ${paymentLink.slug}`,
        }),
      });
      const send = (await sendResponse.json()) as {
        success?: boolean;
        error?: string;
        transaction?: {
          id?: string;
        };
      };

      if (!sendResponse.ok || !send.success) {
        throw new Error(send.error ?? "Payment failed.");
      }

      setReceipt({
        transactionId: send.transaction?.id ?? "Pending Circle transaction",
        amount: paymentLink.amount,
        recipient: walletAddress,
        submittedAt: new Date().toLocaleString(),
      });
      setMessage(
        `Payment submitted${send.transaction?.id ? `: ${send.transaction.id}` : "."}`
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed.");
    } finally {
      setPaying(false);
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
          <Link
            href="/auth"
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-bold text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Login
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 sm:p-8">
          {loading ? (
            <p className="font-semibold text-zinc-700 dark:text-zinc-300">
              Loading payment...
            </p>
          ) : error && !paymentLink ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </p>
          ) : paymentLink ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-bold uppercase tracking-wide text-purple-700 dark:text-purple-300">
                  Payment Request
                </p>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  {paymentLink.status ?? "open"}
                </span>
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
                {paymentLink.title}
              </h1>

              <p className="mt-3 font-medium text-zinc-800 dark:text-zinc-200">
                Pay{" "}
                <span className="font-bold text-zinc-950 dark:text-white">
                  {freelancerName}
                </span>
              </p>

              <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-950">
                <p className="text-sm font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                  Amount
                </p>
                <p className="mt-2 text-4xl font-black tracking-tight text-zinc-950 tabular-nums dark:text-white sm:text-5xl">
                  {paymentLink.amount}{" "}
                  <span className="text-2xl text-purple-700 dark:text-purple-400">
                    USDC
                  </span>
                </p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <InvoiceMeta label="Network" value="Arc Testnet" />
                <InvoiceMeta label="Asset" value="USDC" />
                <InvoiceMeta label="Invoice ID" value={paymentLink.slug} mono />
              </div>

              <div className="mt-6">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Send USDC on Arc Testnet to this address:
                </p>

                <div className="mt-2 break-all rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-600 dark:bg-zinc-950">
                  <p className="font-mono text-xs font-semibold leading-6 text-zinc-900 dark:text-zinc-100 sm:text-sm">
                    {walletAddress}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void copyAddress()}
                  className="mt-4 w-full rounded-lg bg-zinc-950 py-3 font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                >
                  {copied ? "Copied!" : "Copy Address"}
                </button>
              </div>

              {error ? (
                <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                  {error}
                </p>
              ) : null}

              {message ? (
                <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                  {message}
                </p>
              ) : null}
            </>
          ) : null}
        </div>

        {paymentLink ? (
          <aside className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 sm:p-6">
            <div className="flex justify-center rounded-lg bg-white p-4">
              <QRCodeSVG value={walletAddress} size={210} />
            </div>

            <div className="mt-6 rounded-lg bg-zinc-50 p-4 text-center dark:bg-zinc-950">
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Payment Link ID
              </p>
              <p className="mt-2 break-all font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-200">
                {paymentLink.slug}
              </p>
            </div>

            <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-sm font-bold text-zinc-950 dark:text-white">
                What happens next
              </p>
              <div className="mt-3 space-y-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                <p>1. Pay with the QR code, copied address, or Pay Now.</p>
                <p>2. Keep the receipt or transaction ID.</p>
                <p>3. The freelancer can track this link from ARCLINK.</p>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <DynamicWidget />
            </div>

            {sdkHasLoaded && (user || primaryWallet) ? (
              <button
                type="button"
                onClick={() => void payNow()}
                disabled={paying}
                className="mt-4 w-full rounded-lg bg-purple-600 py-3 font-semibold text-white transition hover:bg-purple-500 disabled:opacity-60 dark:bg-purple-500 dark:hover:bg-purple-400"
              >
                {paying ? "Submitting Payment..." : "Pay Now"}
              </button>
            ) : (
              <p className="mt-4 text-center text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                Log in to pay directly from your ARCLINK wallet.
              </p>
            )}

            <p className="mt-6 text-center text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              Only send USDC on Arc Testnet.
            </p>
          </aside>
        ) : null}
      </section>

      {receipt ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/60 px-4 py-4 backdrop-blur-sm sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-receipt-title"
            className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900 sm:p-6"
          >
            <p className="text-sm font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
              Payment submitted
            </p>
            <h2
              id="payment-receipt-title"
              className="mt-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-white"
            >
              Receipt
            </h2>
            <div className="mt-5 space-y-3 text-sm">
              <ReceiptRow label="Amount" value={`${receipt.amount} USDC`} />
              <ReceiptRow label="Submitted" value={receipt.submittedAt} />
              <ReceiptRow label="To" value={receipt.recipient} mono />
              <ReceiptRow label="Transaction ID" value={receipt.transactionId} mono />
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
    </main>
  );
}

function InvoiceMeta({
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
      <p className="text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p
        className={`mt-1 break-all font-semibold text-zinc-950 dark:text-white ${
          mono ? "font-mono text-xs" : "text-sm"
        }`}
      >
        {value}
      </p>
    </div>
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
