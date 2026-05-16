"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import {
  getDynamicFallbackEmail,
  getDynamicFullName,
  getDynamicWalletAddress,
} from "@/lib/dynamicIdentity";

type WalletData = {
  wallet_id?: string | null;
  circle_wallet_id?: string | null;
  address?: string | null;
  wallet_address?: string | null;
  blockchain?: string | null;
};

type SupabaseUser = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  username?: string | null;
};

type Balance = {
  amount: string;
  token?: {
    id?: string;
    name?: string;
    symbol?: string;
  };
};

type SyncResult = {
  success?: boolean;
  error?: string;
  user?: SupabaseUser;
  wallet?: WalletData;
};

type PaymentLinkData = {
  id?: string;
  slug: string;
  title: string;
  amount: string | number;
  status?: string | null;
  created_at?: string | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const { handleLogOut, primaryWallet, sdkHasLoaded, user } =
    useDynamicContext();
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [balance, setBalance] = useState("0.00");
  const [balances, setBalances] = useState<Balance[]>([]);
  const [paymentLinks, setPaymentLinks] = useState<PaymentLinkData[]>([]);
  const [usernameInput, setUsernameInput] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const dynamicWalletAddress = primaryWallet?.address ?? "";
  const email = useMemo(
    () => getDynamicFallbackEmail({ user, walletAddress: dynamicWalletAddress }),
    [dynamicWalletAddress, user]
  );
  const displayName =
    supabaseUser?.username ||
    supabaseUser?.full_name ||
    getDynamicFullName(user) ||
    supabaseUser?.email ||
    email ||
    "ARCLINK user";
  const walletAddress =
    wallet?.address ??
    wallet?.wallet_address ??
    "0x0000000000000000000000000000000000000000";
  const walletId = wallet?.wallet_id ?? wallet?.circle_wallet_id ?? "";

  const syncUserAndWallet = useCallback(async (): Promise<SyncResult> => {
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

    if (!response.ok || !result.success || !result.user || !result.wallet) {
      throw new Error(result.error ?? "Could not sync your wallet.");
    }

    return result;
  }, [dynamicWalletAddress, email, user]);

  const loadWalletAndBalance = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const sync = await syncUserAndWallet();

      setSupabaseUser(sync.user ?? null);
      setUsernameInput(sync.user?.username || sync.user?.full_name || "");
      setWallet(sync.wallet ?? null);

      if (sync.user?.id) {
        const linksRes = await fetch("/api/payments/list", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: sync.user.id }),
        });
        const linksData = (await linksRes.json()) as {
          success?: boolean;
          paymentLinks?: PaymentLinkData[];
        };

        if (linksRes.ok && linksData.success) {
          setPaymentLinks(linksData.paymentLinks ?? []);
        }
      }

      const circleWalletId =
        sync.wallet?.wallet_id ?? sync.wallet?.circle_wallet_id;

      if (!circleWalletId) {
        throw new Error("Wallet is missing Circle wallet ID.");
      }

      const balanceRes = await fetch("/api/wallet/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletId: circleWalletId,
          address: sync.wallet?.address ?? sync.wallet?.wallet_address,
        }),
      });
      const balanceData = (await balanceRes.json()) as {
        success?: boolean;
        error?: string;
        balances?: Balance[];
        nativeBalance?: string | null;
      };

      if (!balanceRes.ok || !balanceData.success) {
        throw new Error(balanceData.error ?? "Could not load balance.");
      }

      const tokenBalances = balanceData.balances ?? [];
      const usdc = tokenBalances.find((item) => {
        const symbol = item.token?.symbol?.toUpperCase() ?? "";
        const name = item.token?.name?.toUpperCase() ?? "";

        return symbol.includes("USDC") || name.includes("USDC");
      });

      setBalances(tokenBalances);
      setBalance(usdc?.amount ?? balanceData.nativeBalance ?? "0.00");
    } catch (e) {
      setBalances([]);
      setPaymentLinks([]);
      setBalance("0.00");
      setError(e instanceof Error ? e.message : "Could not load wallet.");
    } finally {
      setLoading(false);
    }
  }, [syncUserAndWallet]);

  useEffect(() => {
    if (!sdkHasLoaded) {
      return;
    }

    if (!user && !primaryWallet) {
      router.replace("/auth");
      return;
    }

    const frame = requestAnimationFrame(() => {
      void loadWalletAndBalance();
    });

    return () => cancelAnimationFrame(frame);
  }, [loadWalletAndBalance, primaryWallet, router, sdkHasLoaded, user]);

  async function logout() {
    await handleLogOut();
    router.push("/auth");
  }

  async function saveUsername() {
    setProfileMessage("");
    setProfileError("");

    if (!supabaseUser?.id) {
      setProfileError("Your profile is still loading. Try again in a moment.");
      return;
    }

    const username = usernameInput.trim();

    if (!username) {
      setProfileError("Enter a username first.");
      return;
    }

    setSavingUsername(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: supabaseUser.id,
          username,
        }),
      });
      const result = (await response.json()) as {
        success?: boolean;
        error?: string;
        user?: SupabaseUser;
      };

      if (!response.ok || !result.success || !result.user) {
        throw new Error(result.error ?? "Could not save username.");
      }

      setSupabaseUser(result.user);
      setUsernameInput(result.user.username || result.user.full_name || username);
      setProfileMessage("Username saved.");
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : "Could not save username.");
    } finally {
      setSavingUsername(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/85 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/85">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-xl font-black tracking-tight text-purple-700 transition hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300 sm:text-2xl"
        >
          ARCLINK
        </Link>

        <div className="flex min-w-0 items-center gap-3">
          <p className="max-w-44 truncate text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            {displayName}
          </p>
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Logout
          </button>
        </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-white">
              Dashboard
            </h1>
            <p className="mt-2 font-medium leading-relaxed text-zinc-700 dark:text-zinc-300">
              Manage your wallet, receive payments, and track transactions.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadWalletAndBalance()}
            disabled={loading}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-bold text-zinc-900 transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            {loading ? "Refreshing..." : "Refresh Balance"}
          </button>
        </div>

        {error ? (
          <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </p>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <div className="border-b border-zinc-100 bg-zinc-50 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-950/60 sm:px-8">
            <p className="text-sm font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
              Arc Testnet wallet
            </p>
          </div>
          <div className="p-5 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
            Total Balance
          </p>
          <h2 className="mt-2 text-4xl font-black tracking-tight text-zinc-950 tabular-nums dark:text-white sm:text-5xl">
            {loading ? "..." : balance}{" "}
            <span className="text-2xl text-purple-700 dark:text-purple-400 sm:text-3xl">
              USDC
            </span>
          </h2>
          <p className="mt-2 font-semibold text-zinc-700 tabular-nums dark:text-zinc-300">
            {loading ? "Loading wallet + balance..." : `~ $${balance}`}
          </p>

          <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
            <button
              type="button"
              onClick={() => router.push("/wallet/receive")}
              className="rounded-lg bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-500 dark:bg-purple-500 dark:hover:bg-purple-400"
            >
              Receive
            </button>

            <button
              type="button"
              onClick={() => router.push("/wallet/send")}
              className="rounded-lg bg-zinc-950 px-6 py-3 font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Send
            </button>

            <button
              type="button"
              onClick={() => router.push("/pay/create")}
              className="rounded-lg border border-zinc-300 px-6 py-3 font-semibold text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Create Payment Link
            </button>
          </div>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 sm:p-6">
          <p className="text-sm font-bold uppercase tracking-wide text-purple-700 dark:text-purple-300">
            Checklist
          </p>
          <h2 className="mt-2 text-xl font-black tracking-tight text-zinc-950 dark:text-white">
            Get ready to receive
          </h2>
          <div className="mt-5 space-y-3">
            <ChecklistItem done={Boolean(walletId)} text="ARCLINK wallet created" />
            <ChecklistItem done={Number(balance) > 0} text="Fund wallet with Arc Testnet USDC" />
            <ChecklistItem done={paymentLinks.length > 0} text="Create your first payment link" />
          </div>
          <button
            type="button"
            onClick={() => router.push("/pay/create")}
            className="mt-6 w-full rounded-lg bg-purple-600 py-3 font-semibold text-white transition hover:bg-purple-500 dark:bg-purple-500 dark:hover:bg-purple-400"
          >
            Create Payment Link
          </button>
        </div>
        </div>

        <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                Profile
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-zinc-950 dark:text-white">
                Choose your display username
              </h2>
              <p className="mt-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                This name appears in your dashboard and on payment pages instead
                of your email.
              </p>
            </div>
            <div className="rounded-lg bg-zinc-50 px-4 py-3 text-sm font-bold text-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
              Showing as: {displayName}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              value={usernameInput}
              onChange={(event) => setUsernameInput(event.target.value)}
              placeholder="Choose a username"
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 font-semibold text-zinc-950 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
            <button
              type="button"
              onClick={() => void saveUsername()}
              disabled={savingUsername}
              className="rounded-lg bg-zinc-950 px-5 py-3 font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              {savingUsername ? "Saving..." : "Save Username"}
            </button>
          </div>

          {profileError ? (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
              {profileError}
            </p>
          ) : null}

          {profileMessage ? (
            <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
              {profileMessage}
            </p>
          ) : null}
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <h4 className="text-lg font-bold text-zinc-950 dark:text-white">
              Wallet Address
            </h4>
            <p className="mt-2 break-all font-mono text-sm font-medium leading-relaxed text-zinc-800 dark:text-zinc-200">
              {walletAddress}
            </p>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <h4 className="text-lg font-bold text-zinc-950 dark:text-white">
              Circle Wallet ID
            </h4>
            <p className="mt-2 break-all font-mono text-sm font-medium leading-relaxed text-zinc-800 dark:text-zinc-200">
              {walletId || "Not loaded"}
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                Payment activity
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-zinc-950 dark:text-white">
                Recent payment links
              </h2>
            </div>
            <button
              type="button"
              onClick={() => router.push("/pay/create")}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-bold text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              New link
            </button>
          </div>

          {paymentLinks.length ? (
            <div className="mt-5 divide-y divide-zinc-200 dark:divide-zinc-800">
              {paymentLinks.map((link) => (
                <div
                  key={link.id ?? link.slug}
                  className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-zinc-950 dark:text-white">
                      {link.title}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                      {formatPaymentDate(link.created_at)} -{" "}
                      <Link
                        href={`/pay/${link.slug}`}
                        className="text-purple-700 hover:underline dark:text-purple-300"
                      >
                        /pay/{link.slug}
                      </Link>
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <p className="font-mono font-bold text-zinc-950 dark:text-white">
                      {link.amount} USDC
                    </p>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                      {link.status ?? "open"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-lg bg-zinc-50 p-5 text-sm font-semibold text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
              No payment links yet. Create one and send it to a client.
            </div>
          )}
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <h4 className="text-lg font-bold text-zinc-950 dark:text-white">
              Network
            </h4>
            <p className="mt-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              {wallet?.blockchain ?? "ARC-TESTNET"}
            </p>
            <p className="mt-2 font-bold text-emerald-600 dark:text-emerald-400">
              Connected
            </p>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <h4 className="text-lg font-bold text-zinc-950 dark:text-white">
              Circle Returned Tokens
            </h4>
            {balances.length ? (
              <div className="mt-3 space-y-2">
                {balances.map((item) => (
                  <div
                    key={`${item.token?.id ?? item.token?.symbol}-${item.amount}`}
                    className="flex justify-between gap-4 text-sm"
                  >
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {item.token?.symbol ?? item.token?.name ?? "Unknown"}
                    </span>
                    <span className="font-mono text-zinc-700 dark:text-zinc-300">
                      {item.amount}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                No balances returned yet.
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function ChecklistItem({ done, text }: { done: boolean; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-zinc-50 p-3 text-sm font-semibold text-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
      <span
        className={`h-3 w-3 shrink-0 rounded-full ${
          done
            ? "bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.14)]"
            : "bg-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.14)]"
        }`}
        aria-hidden
      />
      {text}
    </div>
  );
}

function formatPaymentDate(value?: string | null) {
  if (!value) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
