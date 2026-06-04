"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
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
  DataRow,
  Field,
  Modal,
  PageSection,
  ProductNav,
} from "@/components/ui/system";

type WalletData = {
  wallet_id?: string | null;
  circle_wallet_id?: string | null;
};

type Receipt = {
  transactionId: string;
  state: string;
  recipient: string;
  amount: string;
  message: string;
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
      setError("Please enter recipient email and amount.");
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
          senderEmail: email,
          recipientEmail: recipient,
          amount,
          message: note,
        }),
      });
      const result = (await response.json()) as {
        success?: boolean;
        error?: string;
        transaction?: {
          id?: string;
          state?: string;
          transaction?: {
            id?: string;
            state?: string;
          };
        };
      };

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Transfer failed.");
      }

      setReceipt({
        transactionId:
          result.transaction?.id ??
          result.transaction?.transaction?.id ??
          "Pending Circle transaction",
        state:
          result.transaction?.state ??
          result.transaction?.transaction?.state ??
          "SUBMITTED",
        recipient,
        amount,
        message: note,
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
    <AppShell>
      <ProductNav
        label="Send money"
        action={
          <Button type="button" variant="secondary" size="sm" onClick={() => router.push("/dashboard")}>
            Dashboard
          </Button>
        }
      />

      <PageSection>
        <Container className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <Badge>Send funds</Badge>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white">
              Send money by email
            </h1>
            <p className="mt-4 leading-7 text-slate-400">
              Enter a recipient email, amount, and optional message. ARCLINK
              finds the wallet, routes USDC, and gives you a receipt.
            </p>

            <Alert tone={walletId ? "blue" : "slate"} className="mt-6">
              {loadingWallet
                ? "Preparing your payment account..."
                : walletId
                  ? `Ready to send from ${email}`
                  : "Payment account not ready"}
            </Alert>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <DataRow label="Recipient" value="Email address" />
              <DataRow label="Asset" value="USDC" />
            </div>
          </Card>

          <Card className="p-6 sm:p-8">
            <form onSubmit={handleSend} className="space-y-5">
              <Field
                label="Recipient Email"
                type="email"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value.toLowerCase())}
                placeholder="recipient@email.com"
              />

              <Field
                label="Amount (USDC)"
                type="number"
                min="0"
                step="0.000001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="50"
                className="font-mono tabular-nums"
              />

              <Field
                label="Message (optional)"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Website design payment"
              />

              {error ? <Alert tone="red">{error}</Alert> : null}
              {message ? <Alert>{message}</Alert> : null}

              <Button
                type="submit"
                disabled={loading || loadingWallet || !walletId}
                className="w-full"
              >
                {loading ? "Sending..." : "Send USDC"}
              </Button>
            </form>
          </Card>
        </Container>
      </PageSection>

      {receipt ? (
        <Modal
          title="Receipt"
          eyebrow="Transaction submitted"
          onClose={() => setReceipt(null)}
        >
          <div className="space-y-3 text-sm">
            <DataRow label="Amount" value={`${receipt.amount} USDC`} />
            <DataRow label="Status" value={receipt.state} />
            <DataRow label="Submitted" value={receipt.submittedAt} />
            <DataRow label="To" value={receipt.recipient} />
            <DataRow label="Transaction ID" value={receipt.transactionId} mono />
            {receipt.message ? (
              <DataRow label="Message" value={receipt.message} />
            ) : null}
          </div>

          <Button type="button" onClick={() => setReceipt(null)} className="mt-6 w-full">
            Done
          </Button>
        </Modal>
      ) : null}
    </AppShell>
  );
}
