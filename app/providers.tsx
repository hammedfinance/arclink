"use client";

import type { ReactNode } from "react";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

const DYNAMIC_ENV_PLACEHOLDER = "your_dynamic_environment_id_here";
const DYNAMIC_ENV_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function Providers({ children }: { children: ReactNode }) {
  const environmentId = process.env.NEXT_PUBLIC_DYNAMIC_ENV_ID?.trim();
  const hasValidDynamicEnvironmentId =
    Boolean(environmentId) &&
    environmentId !== DYNAMIC_ENV_PLACEHOLDER &&
    DYNAMIC_ENV_ID_PATTERN.test(environmentId ?? "");

  if (!hasValidDynamicEnvironmentId) {
    return (
      <ThemeProvider>
        <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
          <section className="w-full max-w-lg rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm font-semibold uppercase tracking-wide text-purple-700 dark:text-purple-300">
              Dynamic setup required
            </p>
            <h1 className="mt-3 text-2xl font-bold tracking-tight">
              Add your real Dynamic environment ID
            </h1>
            <p className="mt-4 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
              ARCLINK cannot show the login form while{" "}
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">
                NEXT_PUBLIC_DYNAMIC_ENV_ID
              </code>{" "}
              is missing, still set to the placeholder, or not a valid Dynamic
              environment ID.
            </p>
            <p className="mt-4 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
              Put the environment ID from your Dynamic dashboard into{" "}
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">
                .env.local
              </code>
              , then restart{" "}
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">
                npm run dev
              </code>
              .
            </p>
          </section>
        </main>
        <ThemeToggle />
      </ThemeProvider>
    );
  }

  const dynamicEnvironmentId = environmentId as string;

  return (
    <DynamicContextProvider
      settings={{
        appName: "ARCLINK",
        environmentId: dynamicEnvironmentId,
        initialAuthenticationMode: "connect-and-sign",
        walletConnectors: [EthereumWalletConnectors],
        walletConnectPreferredChains: ["eip155:5042001"],
        networkValidationMode: "never",
      }}
    >
      <ThemeProvider>
        {children}
        <ThemeToggle />
      </ThemeProvider>
    </DynamicContextProvider>
  );
}
