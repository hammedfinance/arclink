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
  PageSection,
  ProductNav,
} from "@/components/ui/system";

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
    <AppShell>
      <ProductNav
        label="Create payment"
        action={
          <Button type="button" variant="secondary" size="sm" onClick={() => router.push("/dashboard")}>
            Dashboard
          </Button>
        }
      />

      <PageSection>
        <Container className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <Badge>Client checkout</Badge>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white">
              Create Payment Link
            </h1>
            <p className="mt-4 leading-7 text-slate-400">
              Generate a shareable Arc Testnet USDC checkout page for a client.
              The link is tied to your synced ARCLINK wallet.
            </p>
            <div className="mt-6 grid gap-3">
              <DataRow label="Rail" value="Circle wallet infrastructure" />
              <DataRow label="Asset" value="USDC on Arc Testnet" />
              <DataRow label="Recipient" value="Share by email or direct link" />
            </div>
          </Card>

          <Card className="p-6 sm:p-8">
            <form onSubmit={handleGenerate} className="space-y-5">
              <Field
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Website Design Payment"
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

              {error ? <Alert tone="red">{error}</Alert> : null}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Creating..." : "Generate Link"}
              </Button>
            </form>

            {generatedLink ? (
              <div className="mt-8 rounded-3xl border border-blue-300/20 bg-blue-500/10 p-5">
                <p className="text-sm font-black uppercase tracking-wide text-blue-100">
                  Your Payment Link
                </p>
                <p className="mt-3 break-all font-mono text-sm font-semibold text-white">
                  {generatedLink}
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => navigator.clipboard.writeText(generatedLink)}
                  >
                    Copy Link
                  </Button>
                  <Button type="button" onClick={goToCheckout}>
                    Preview
                  </Button>
                </div>
              </div>
            ) : null}
          </Card>
        </Container>
      </PageSection>
    </AppShell>
  );
}
