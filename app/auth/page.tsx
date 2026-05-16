"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DynamicWidget, useDynamicContext } from "@dynamic-labs/sdk-react-core";

export default function AuthPage() {
  const router = useRouter();
  const { sdkHasLoaded, user, primaryWallet } = useDynamicContext();

  useEffect(() => {
    if (sdkHasLoaded && (user || primaryWallet)) {
      router.replace("/dashboard");
    }
  }, [primaryWallet, router, sdkHasLoaded, user]);

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-zinc-100 px-4 py-10 dark:bg-zinc-950">
      <div className="absolute inset-0 -z-20">
        <div
          className="hero-bg-slide absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/arclinllatest.avif')",
          }}
        />
        <div
          className="hero-bg-slide absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/arcimage1.webp')",
          }}
        />
        <div
          className="hero-bg-slide absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/arclink2.webp')",
          }}
        />
      </div>
      <div className="absolute inset-0 -z-10 bg-white/82 backdrop-blur-[2px] dark:bg-zinc-950/78" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_15%,rgba(147,51,234,0.18),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.72),rgba(255,255,255,0.95))] dark:bg-[radial-gradient(circle_at_50%_15%,rgba(168,85,247,0.18),transparent_32%),linear-gradient(180deg,rgba(9,9,11,0.68),rgba(9,9,11,0.94))]" />

      <section className="w-full max-w-md rounded-lg border border-white/70 bg-white/90 p-6 shadow-xl shadow-zinc-950/10 backdrop-blur-md dark:border-zinc-700/80 dark:bg-zinc-900/88 sm:p-8">
        <Link
          href="/"
          className="block text-center text-3xl font-black tracking-tight text-purple-700 transition hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300"
        >
          ARCLINK
        </Link>
        <p className="mt-3 text-center font-medium leading-relaxed text-zinc-700 dark:text-zinc-300">
          Sign in with Dynamic to create your Arc Testnet USDC wallet.
        </p>

        <div className="mt-8 flex justify-center">
          <DynamicWidget />
        </div>

        <p className="mt-6 text-center text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Circle wallet creation stays server-side after login.
        </p>
      </section>
    </main>
  );
}
