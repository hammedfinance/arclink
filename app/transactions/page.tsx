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
  Card,
  Container,
  EmptyState,
  PageSection,
  ProductNav,
  Skeleton,
} from "@/components/ui/system";

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

export default function TransactionsPage() {
  const router = useRouter();
  const { primaryWallet, sdkHasLoaded, user } = useDynamicContext();
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const dynamicWalletAddress = primaryWallet?.address ?? "";
  const email = useMemo(
    () => getDynamicFallbackEmail({ user, walletAddress: dynamicWalletAddress }),
    [dynamicWalletAddress, user]
  );

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError("");

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
      const syncResult = (await syncResponse.json()) as {
        success?: boolean;
        error?: string;
        user?: {
          id: string;
        };
      };

      if (!syncResponse.ok || !syncResult.success || !syncResult.user?.id) {
        throw new Error(syncResult.error ?? "Could not load your account.");
      }

      const response = await fetch("/api/transactions/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: syncResult.user.id, limit: 50 }),
      });
      const result = (await response.json()) as {
        success?: boolean;
        error?: string;
        transactions?: TransactionData[];
      };

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Could not load transactions.");
      }

      setTransactions(result.transactions ?? []);
    } catch (e) {
      setTransactions([]);
      setError(e instanceof Error ? e.message : "Could not load transactions.");
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
      void loadTransactions();
    });

    return () => cancelAnimationFrame(frame);
  }, [loadTransactions, primaryWallet, router, sdkHasLoaded, user]);

  return (
    <AppShell>
      <ProductNav
        label="Transactions"
        action={
          <Button type="button" variant="secondary" size="sm" onClick={() => router.push("/dashboard")}>
            Dashboard
          </Button>
        }
      />

      <PageSection>
        <Container>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge>Payment history</Badge>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
                Transactions
              </h1>
              <p className="mt-3 max-w-2xl leading-7 text-slate-400">
                Review sent and received USDC payments by email address.
              </p>
            </div>
            <Button type="button" onClick={() => router.push("/wallet/send")}>
              Send Money
            </Button>
          </div>

          {error ? (
            <Alert tone="red" className="mt-6">
              {error}
            </Alert>
          ) : null}

          <Card className="mt-8 p-0">
            <div className="border-b border-white/[0.08] px-5 py-4 sm:px-6">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-400">
                Activity
              </p>
            </div>
            {loading ? (
              <div className="space-y-3 p-5 sm:p-6">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : transactions.length ? (
              <div className="divide-y divide-white/[0.06]">
                {transactions.map((transaction) => {
                  const sent = transaction.sender_email === email;

                  return (
                    <div
                      key={transaction.id ?? transaction.transaction_id}
                      className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-bold text-white">
                          {sent ? "Sent to" : "Received from"}{" "}
                          {sent
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
                          {sent ? "-" : "+"}
                          {transaction.amount} USDC
                        </p>
                        <Badge tone={transaction.status === "failed" ? "red" : "amber"}>
                          {transaction.status ?? "pending"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-5 sm:p-6">
                <EmptyState
                  title="No transactions yet"
                  text="Email-based USDC payments will appear here once you send or receive money."
                />
              </div>
            )}
          </Card>
        </Container>
      </PageSection>
    </AppShell>
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
