"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DynamicWidget, useDynamicContext } from "@dynamic-labs/sdk-react-core";
import {
  AppShell,
  Badge,
  Card,
  Container,
  DataRow,
  MotionPanel,
} from "@/components/ui/system";

export default function AuthPage() {
  const router = useRouter();
  const { primaryWallet, sdkHasLoaded, user } = useDynamicContext();

  useEffect(() => {
    if (sdkHasLoaded && (user || primaryWallet)) {
      router.replace("/dashboard");
    }
  }, [primaryWallet, router, sdkHasLoaded, user]);

  return (
    <AppShell>
      <section className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 -z-20">
          <div
            className="hero-bg-slide absolute inset-0 scale-105 bg-cover bg-center opacity-70 blur-sm"
            style={{ backgroundImage: "url('/images/arclinllatest.avif')" }}
          />
          <div
            className="hero-bg-slide absolute inset-0 scale-105 bg-cover bg-center opacity-70 blur-sm"
            style={{ backgroundImage: "url('/images/arcimage1.webp')" }}
          />
          <div
            className="hero-bg-slide absolute inset-0 scale-105 bg-cover bg-center opacity-70 blur-sm"
            style={{ backgroundImage: "url('/images/arclink2.webp')" }}
          />
        </div>
        <div className="absolute inset-0 -z-10 bg-[#020617]/88" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_18%,rgba(37,99,235,0.36),transparent_30%),linear-gradient(180deg,rgba(2,6,23,0.46),#020617_70%)]" />

        <Container className="grid min-h-screen items-center gap-8 py-10 lg:grid-cols-[0.95fr_1.05fr]">
          <MotionPanel className="mx-auto w-full max-w-xl lg:mx-0">
            <Link
              href="/"
              className="inline-flex text-2xl font-black tracking-tight text-white transition hover:text-blue-100"
            >
              ARCLINK
            </Link>
            <div className="mt-7">
              <Badge>Dynamic login</Badge>
              <h1 className="mt-5 text-5xl font-black leading-[0.96] tracking-tight text-white sm:text-6xl">
                Sign in to your USDC payment workspace.
              </h1>
              <p className="mt-6 max-w-lg text-base leading-8 text-slate-300">
                Connect with Dynamic to create or reopen your ARCLINK account.
                Your Circle wallet setup continues securely on the server after
                login.
              </p>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <DataRow label="Auth" value="Dynamic" />
              <DataRow label="Asset" value="USDC" />
              <DataRow label="Network" value="Arc Testnet" />
            </div>
          </MotionPanel>

          <MotionPanel className="mx-auto w-full max-w-md lg:ml-auto">
            <Card className="relative overflow-hidden p-6 sm:p-8">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/70 to-transparent" />
              <div className="text-center">
                <Badge>Secure access</Badge>
                <h2 className="mt-4 text-3xl font-black tracking-tight text-white">
                  Login or create account
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Use the Dynamic modal below to continue.
                </p>
              </div>

              <div className="mt-8 flex justify-center">
                <DynamicWidget />
              </div>
            </Card>
          </MotionPanel>
        </Container>
      </section>
    </AppShell>
  );
}
