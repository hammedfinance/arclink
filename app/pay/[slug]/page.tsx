"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useParams } from "next/navigation";
import { DynamicWidget, useDynamicContext } from "@dynamic-labs/sdk-react-core";
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
  MarketingNav,
  Modal,
  PageSection,
  Skeleton,
} from "@/components/ui/system";

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
    <AppShell>
      <MarketingNav />

      <PageSection>
        <Container className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <Card className="p-6 sm:p-8">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : error && !paymentLink ? (
              <EmptyState
                title="Payment link unavailable"
                text={error}
                action={<ButtonLink href="/auth">Login to ARCLINK</ButtonLink>}
              />
            ) : paymentLink ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Badge>Payment Request</Badge>
                  <Badge tone="amber">{paymentLink.status ?? "open"}</Badge>
                </div>
                <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl">
                  {paymentLink.title}
                </h1>
                <p className="mt-4 font-medium text-slate-300">
                  Pay <span className="font-bold text-white">{freelancerName}</span>
                </p>

                <div className="mt-7 rounded-3xl border border-white/[0.08] bg-white/[0.055] p-5">
                  <p className="text-sm font-bold uppercase tracking-wide text-slate-400">
                    Amount
                  </p>
                  <p className="mt-2 text-5xl font-black tracking-tight text-white tabular-nums sm:text-6xl">
                    {paymentLink.amount}{" "}
                    <span className="text-2xl text-blue-200">USDC</span>
                  </p>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <DataRow label="Network" value="Arc Testnet" />
                  <DataRow label="Asset" value="USDC" />
                  <DataRow label="Invoice ID" value={paymentLink.slug} mono />
                </div>

                <div className="mt-6">
                  <p className="text-sm font-bold text-white">
                    Send USDC on Arc Testnet to this address:
                  </p>
                  <div className="mt-3">
                    <DataRow label="Recipient wallet" value={walletAddress} mono />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void copyAddress()}
                    className="mt-4 w-full"
                  >
                    {copied ? "Copied!" : "Copy Address"}
                  </Button>
                </div>

                {error ? (
                  <Alert tone="red" className="mt-4">
                    {error}
                  </Alert>
                ) : null}

                {message ? (
                  <Alert className="mt-4">{message}</Alert>
                ) : null}
              </>
            ) : null}
          </Card>

          {paymentLink ? (
            <aside>
              <Card className="p-6">
                <div className="flex justify-center rounded-3xl border border-white/[0.08] bg-white p-5">
                  <QRCodeSVG value={walletAddress} size={220} />
                </div>

                <div className="mt-6">
                  <DataRow label="Payment Link ID" value={paymentLink.slug} mono />
                </div>

                <div className="mt-6 rounded-3xl border border-white/[0.08] bg-white/[0.045] p-4">
                  <p className="text-sm font-black text-white">What happens next</p>
                  <div className="mt-3 space-y-2 text-sm font-semibold leading-6 text-slate-400">
                    <p>1. Pay with the QR code, copied address, or Pay Now.</p>
                    <p>2. Keep the receipt or transaction ID.</p>
                    <p>3. The freelancer tracks the link from ARCLINK.</p>
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <DynamicWidget />
                </div>

                {sdkHasLoaded && (user || primaryWallet) ? (
                  <Button
                    type="button"
                    onClick={() => void payNow()}
                    disabled={paying}
                    className="mt-4 w-full"
                  >
                    {paying ? "Submitting Payment..." : "Pay Now"}
                  </Button>
                ) : (
                  <Alert tone="slate" className="mt-4 text-center">
                    Log in to pay directly from your ARCLINK wallet.
                  </Alert>
                )}

                <Alert tone="slate" className="mt-5 text-center">
                  Only send USDC on Arc Testnet.
                </Alert>
              </Card>
            </aside>
          ) : null}
        </Container>
      </PageSection>

      {receipt ? (
        <Modal title="Receipt" eyebrow="Payment submitted" onClose={() => setReceipt(null)}>
          <div className="space-y-3 text-sm">
            <DataRow label="Amount" value={`${receipt.amount} USDC`} />
            <DataRow label="Submitted" value={receipt.submittedAt} />
            <DataRow label="To" value={receipt.recipient} mono />
            <DataRow label="Transaction ID" value={receipt.transactionId} mono />
          </div>
          <Button type="button" onClick={() => setReceipt(null)} className="mt-6 w-full">
            Done
          </Button>
        </Modal>
      ) : null}
    </AppShell>
  );
}
