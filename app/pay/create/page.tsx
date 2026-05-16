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

type SyncResult = {
  success?: boolean;
  error?: string;
  user?: {
    id: string;
  };
};

export default function CreatePaymentLinkPage() {
  const router = useRouter();
  const { primaryWallet, sdkHasLoaded, user } = useDynamicContext();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const dynamicWalletAddress = primaryWallet?.address ?? "";
  const email = useMemo(
    () => getDynamicFallbackEmail({ user, walletAddress: dynamicWalletAddress }),
    [dynamicWalletAddress, user]
  );

  const syncUser = useCallback(async (): Promise<string> => {
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
    const result = (await response.json()) as SyncResult;

    if (!response.ok || !result.success || !result.user?.id) {
      throw new Error(result.error ?? "Could not sync user.");
    }

    return result.user.id;
  }, [dynamicWalletAddress, email, user]);

  useEffect(() => {
    if (sdkHasLoaded && !user && !primaryWallet) {
      router.replace("/auth");
    }
  }, [primaryWallet, router, sdkHasLoaded, user]);

  async function handleGenerate(e: FormEvent) {
    e.preventDefault();
    setError("");
    setGeneratedLink("");

    if (!title || !amount) {
      setError("Please enter title and amount.");
      return;
    }

    setLoading(true);

    try {
      const userId = await syncUser();
      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          title,
          amount,
        }),
      });
      const result = (await response.json()) as {
        success?: boolean;
        error?: string;
        paymentLink?: {
          slug?: string;
        };
      };

      if (!response.ok || !result.success || !result.paymentLink?.slug) {
        throw new Error(result.error ?? "Could not create payment link.");
      }

      setGeneratedLink(`${window.location.origin}/pay/${result.paymentLink.slug}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create payment link.");
    } finally {
      setLoading(false);
    }
  }

  function goToCheckout() {
    if (!generatedLink) return;
    const slug = generatedLink.split("/pay/")[1];
    router.push(`/pay/${slug}`);
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
            Client checkout
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 dark:text-white">
            Create Payment Link
          </h1>
          <p className="mt-3 leading-7 text-zinc-700 dark:text-zinc-300">
            Generate a shareable Arc Testnet USDC checkout page for your client.
          </p>

          <div className="mt-6 grid gap-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-950">
              Each link is tied to your logged-in ARCLINK wallet.
            </div>
            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-950">
              Clients can scan, copy, or pay directly after logging in.
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 sm:p-8">
        <form onSubmit={handleGenerate} className="space-y-5">
          <div>
            <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Website Design Payment"
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

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-purple-600 py-3 font-semibold text-white transition hover:bg-purple-500 disabled:opacity-60 dark:bg-purple-500 dark:hover:bg-purple-400"
          >
            {loading ? "Creating..." : "Generate Link"}
          </button>
        </form>

        {generatedLink ? (
          <div className="mt-8 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-600 dark:bg-zinc-950">
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Your Payment Link:
            </p>
            <p className="mt-2 break-all text-sm font-semibold text-purple-700 dark:text-purple-300">
              {generatedLink}
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(generatedLink)}
                className="rounded-lg bg-zinc-950 py-2 font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                Copy Link
              </button>

              <button
                type="button"
                onClick={goToCheckout}
                className="rounded-lg border border-zinc-300 py-2 font-semibold text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                Preview
              </button>
            </div>
          </div>
        ) : null}
        </div>
      </section>
    </main>
  );
}
