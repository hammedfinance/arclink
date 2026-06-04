"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import {
  getDynamicFallbackEmail,
  getDynamicFullName,
  getDynamicWalletAddress,
} from "@/lib/dynamicIdentity";
import {
  Alert,
  AppShell,
  Badge,
  Button,
  ButtonLink,
  Card,
  Container,
  DataRow,
  EmptyState,
  Field,
  MetricCard,
  MotionPanel,
  PageSection,
  ProductNav,
  Skeleton,
} from "@/components/ui/system";

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

type TransactionData = {
  id?: string;
  sender_email: string;
  recipient_email: string;
  amount: string | number;
  status?: string | null;
  transaction_id?: string | null;
  message?: string | null;
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
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
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
        const [linksRes, transactionsRes] = await Promise.all([
          fetch("/api/payments/list", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: sync.user.id }),
          }),
          fetch("/api/transactions/list", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: sync.user.id, limit: 8 }),
          }),
        ]);
        const linksData = (await linksRes.json()) as {
          success?: boolean;
          paymentLinks?: PaymentLinkData[];
        };
        const transactionsData = (await transactionsRes.json()) as {
          success?: boolean;
          transactions?: TransactionData[];
        };

        setPaymentLinks(
          linksRes.ok && linksData.success ? linksData.paymentLinks ?? [] : []
        );
        setTransactions(
          transactionsRes.ok && transactionsData.success
            ? transactionsData.transactions ?? []
            : []
        );
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
      setTransactions([]);
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
    <AppShell>
      <ProductNav
        label="Dashboard"
        userLabel={displayName}
        action={
          <Button type="button" variant="secondary" size="sm" onClick={() => void logout()}>
            Logout
          </Button>
        }
      />

      <PageSection>
        <Container>
          <MotionPanel className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge>Payment workspace</Badge>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
                Dashboard
              </h1>
              <p className="mt-3 max-w-2xl leading-7 text-slate-400">
                Manage your wallet, receive payments, track activity, and send
                USDC through ARCLINK.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void loadWalletAndBalance()}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh Balance"}
            </Button>
          </MotionPanel>

          {error ? (
            <Alert tone="red" className="mt-6">
              {error}
            </Alert>
          ) : null}

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <MetricCard label="Available balance" value={loading ? "..." : balance} suffix="USDC" />
            <MetricCard label="Recent payments" value={String(transactions.length)} />
            <MetricCard label="Payment links" value={String(paymentLinks.length)} />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="overflow-hidden p-0">
              <div className="border-b border-white/[0.08] bg-white/[0.035] px-5 py-4 sm:px-8">
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-400">
                  Arc Testnet wallet
                </p>
              </div>
              <div className="p-5 sm:p-8">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Total Balance
                </p>
                {loading ? (
                  <Skeleton className="mt-3 h-14 w-64" />
                ) : (
                  <h2 className="mt-2 text-5xl font-black tracking-tight text-white tabular-nums sm:text-6xl">
                    {balance} <span className="text-2xl text-blue-200">USDC</span>
                  </h2>
                )}
                <p className="mt-3 font-semibold text-slate-400 tabular-nums">
                  {loading ? "Loading wallet and balance..." : `~ $${balance}`}
                </p>

                <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap">
                  <Button type="button" onClick={() => router.push("/wallet/receive")}>
                    Receive Money
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => router.push("/wallet/send")}
                  >
                    Send Money
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.push("/pay/create")}
                  >
                    Create Payment Link
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => router.push("/transactions")}
                  >
                    View Activity
                  </Button>
                </div>
              </div>
            </Card>

            <Card>
              <Badge>Readiness</Badge>
              <h2 className="mt-4 text-2xl font-black tracking-tight text-white">
                Get ready to receive
              </h2>
              <div className="mt-5 space-y-3">
                <ChecklistItem done={Boolean(walletId)} text="ARCLINK wallet created" />
                <ChecklistItem done={Number(balance) > 0} text="Fund wallet with Arc Testnet USDC" />
                <ChecklistItem done={paymentLinks.length > 0} text="Create your first payment link" />
              </div>
              <Button
                type="button"
                onClick={() => router.push("/pay/create")}
                className="mt-6 w-full"
              >
                Create Payment Link
              </Button>
            </Card>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-400">
                Profile
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
                Choose your display username
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                This appears in your dashboard and on payment pages instead of
                your email.
              </p>
              <div className="mt-5 space-y-3">
                <Field
                  label="Username"
                  value={usernameInput}
                  onChange={(event) => setUsernameInput(event.target.value)}
                  placeholder="Choose a username"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void saveUsername()}
                  disabled={savingUsername}
                  className="w-full"
                >
                  {savingUsername ? "Saving..." : "Save Username"}
                </Button>
              </div>
              {profileError ? (
                <Alert tone="red" className="mt-4">
                  {profileError}
                </Alert>
              ) : null}
              {profileMessage ? (
                <Alert className="mt-4">{profileMessage}</Alert>
              ) : null}
            </Card>

            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-400">
                    Account activity
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
                    Recent email payments
                  </h2>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={() => router.push("/wallet/send")}>
                  Send
                </Button>
              </div>

              {transactions.length ? (
                <div className="mt-5 overflow-hidden rounded-2xl border border-white/[0.08]">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id ?? transaction.transaction_id}
                      className="grid gap-3 border-b border-white/[0.06] px-4 py-4 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-bold text-white">
                          {transaction.sender_email === email ? "Sent to" : "Received from"}{" "}
                          {transaction.sender_email === email
                            ? transaction.recipient_email
                            : transaction.sender_email}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-400">
                          {formatPaymentDate(transaction.created_at)}
                          {transaction.message ? ` - ${transaction.message}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <p className="font-mono font-bold text-white">
                          {transaction.sender_email === email ? "-" : "+"}
                          {transaction.amount} USDC
                        </p>
                        <Badge tone={transaction.status === "failed" ? "red" : "amber"}>
                          {transaction.status ?? "pending"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No payments yet"
                  text="Send or receive USDC with an email address and activity will appear here."
                  action={<ButtonLink href="/wallet/send">Send first payment</ButtonLink>}
                />
              )}
            </Card>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Card>
              <h3 className="text-lg font-black text-white">Wallet Address</h3>
              <p className="mt-3 break-all font-mono text-sm font-semibold leading-7 text-slate-300">
                {walletAddress}
              </p>
            </Card>
            <Card>
              <h3 className="text-lg font-black text-white">Circle Wallet ID</h3>
              <p className="mt-3 break-all font-mono text-sm font-semibold leading-7 text-slate-300">
                {walletId || "Not loaded"}
              </p>
            </Card>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Card>
              <h3 className="text-lg font-black text-white">Network</h3>
              <p className="mt-2 text-sm font-semibold text-slate-300">
                {wallet?.blockchain ?? "ARC-TESTNET"}
              </p>
              <Badge>Connected</Badge>
            </Card>
            <Card>
              <h3 className="text-lg font-black text-white">Circle Returned Tokens</h3>
              {balances.length ? (
                <div className="mt-4 space-y-3">
                  {balances.map((item) => (
                    <DataRow
                      key={`${item.token?.id ?? item.token?.symbol}-${item.amount}`}
                      label={item.token?.symbol ?? item.token?.name ?? "Unknown"}
                      value={item.amount}
                      mono
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No balances returned"
                  text="Token balances will appear here after Circle returns assets for this wallet."
                />
              )}
            </Card>
          </div>
        </Container>
      </PageSection>
    </AppShell>
  );
}

function ChecklistItem({ done, text }: { done: boolean; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.045] p-3 text-sm font-semibold text-slate-300">
      <span
        className={`h-3 w-3 shrink-0 rounded-full ${
          done
            ? "bg-blue-300 shadow-[0_0_0_4px_rgba(96,165,250,0.14)]"
            : "bg-red-400 shadow-[0_0_0_4px_rgba(248,113,113,0.14)]"
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
