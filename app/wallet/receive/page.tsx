"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useRouter } from "next/navigation";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import {
  getDynamicFallbackEmail,
  getDynamicFullName,
  getDynamicWalletAddress,
} from "@/lib/dynamicIdentity";

type WalletData = {
  address?: string | null;
  wallet_address?: string | null;
};

export default function ReceivePage() {
  const router = useRouter();
  const { primaryWallet, sdkHasLoaded, user } = useDynamicContext();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const dynamicWalletAddress = primaryWallet?.address ?? "";
  const email = useMemo(
    () => getDynamicFallbackEmail({ user, walletAddress: dynamicWalletAddress }),
    [dynamicWalletAddress, user]
  );
  const walletAddress =
    wallet?.address ??
    wallet?.wallet_address ??
    "0x0000000000000000000000000000000000000000";

  const loadWallet = useCallback(async () => {
    setLoading(true);
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
      setLoading(false);
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

  async function copyAddress() {
    await navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          Receive funds
        </p>

        <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 dark:text-white">
          Receive USDC
        </h1>
        <p className="mt-3 leading-7 text-zinc-700 dark:text-zinc-300">
          Share your Arc Testnet wallet address or QR code with your client.
        </p>

        {error ? (
          <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </p>
        ) : null}

        <div className="mt-6 break-all rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-600 dark:bg-zinc-950">
          <p className="font-mono text-xs font-semibold leading-6 text-zinc-900 dark:text-zinc-100 sm:text-sm">
            {loading ? "Loading wallet..." : walletAddress}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void copyAddress()}
          disabled={loading || !wallet}
          className="mt-4 w-full rounded-lg bg-purple-600 py-3 font-semibold text-white transition hover:bg-purple-500 disabled:opacity-60 dark:bg-purple-500 dark:hover:bg-purple-400"
        >
          {copied ? "Copied!" : "Copy Address"}
        </button>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 sm:p-8">
        <div className="flex justify-center rounded-lg bg-white p-4">
          <QRCodeSVG value={walletAddress} size={200} />
        </div>

        <p className="mt-6 text-center text-xs font-semibold text-zinc-600 dark:text-zinc-400">
          Only send USDC on Arc Testnet to this address.
        </p>
      </div>
      </section>
    </main>
  );
}
