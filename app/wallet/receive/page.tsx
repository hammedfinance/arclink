"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
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
  PageSection,
  ProductNav,
  Skeleton,
} from "@/components/ui/system";

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

  async function copyEmail() {
    await navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <AppShell>
      <ProductNav
        label="Receive money"
        action={
          <Button type="button" variant="secondary" size="sm" onClick={() => router.push("/dashboard")}>
            Dashboard
          </Button>
        }
      />

      <PageSection>
        <Container className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <Badge>Receive funds</Badge>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white">
              Receive USDC using your email address.
            </h1>
            <p className="mt-4 leading-7 text-slate-400">
              Share your ARCLINK email with clients and teammates. They can send
              USDC without seeing wallet addresses or chain details.
            </p>

            {error ? (
              <Alert tone="red" className="mt-6">
                {error}
              </Alert>
            ) : null}

            <div className="mt-6">
              {loading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <DataRow label="Your ARCLINK email" value={email} />
              )}
            </div>

            <Button
              type="button"
              onClick={() => void copyEmail()}
              disabled={loading || !email}
              className="mt-5 w-full"
            >
              {copied ? "Copied!" : "Copy Email"}
            </Button>

            <div className="mt-5">
              <DataRow label="Technical wallet address" value={walletAddress} mono />
            </div>
          </Card>

          <Card className="p-6 sm:p-8">
            <div className="mx-auto flex max-w-sm justify-center rounded-3xl border border-white/[0.08] bg-white p-5">
              <QRCodeSVG value={`arclink:${email}`} size={220} />
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <DataRow label="Identifier" value="Email" />
              <DataRow label="Asset" value="USDC" />
            </div>
            <Alert tone="slate" className="mt-5 text-center">
              Ask senders to use your email inside ARCLINK.
            </Alert>
          </Card>
        </Container>
      </PageSection>
    </AppShell>
  );
}
