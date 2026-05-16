"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

function ts() {
  return new Date().toLocaleTimeString(undefined, { hour12: false });
}

export default function TestCirclePage() {
  const [logs, setLogs] = useState<string[]>([
    `[${ts()}] Ready. Click “Create Wallet” to call POST /api/wallet/create.`,
  ]);
  const [loading, setLoading] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const append = useCallback((line: string) => {
    setLogs((prev) => [...prev, `[${ts()}] ${line}`]);
  }, []);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  function clearTerminal() {
    setLogs([`[${ts()}] Cleared.`]);
  }

  async function createWallet() {
    setLoading(true);
    append("> POST /api/wallet/create");
    try {
      const res = await fetch("/api/wallet/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const text = await res.text();
      append(`< HTTP ${res.status} ${res.statusText}`);
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
        append(JSON.stringify(parsed, null, 2));
      } catch {
        append(text || "(empty body)");
      }
    } catch (e) {
      append(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
      append("(done)");
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
        <Link
          href="/"
          className="text-sm font-semibold text-purple-700 dark:text-purple-400 hover:underline"
        >
          ← Home
        </Link>

        <h1 className="text-3xl font-bold mt-4 tracking-tight">
          Circle wallet test
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2 text-sm leading-relaxed">
          Output appears in the terminal panel below (browser-only mock, not your
          real Cursor terminal).
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={createWallet}
            disabled={loading}
            className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-500 disabled:opacity-50 dark:bg-purple-500 dark:hover:bg-purple-400"
          >
            {loading ? "Creating…" : "Create wallet"}
          </button>
          <button
            type="button"
            onClick={clearTerminal}
            className="border-2 border-zinc-300 dark:border-zinc-600 px-6 py-3 rounded-xl font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
          >
            Clear terminal
          </button>
        </div>
      </div>

      {/* Fake terminal docked to bottom */}
      <div className="shrink-0 border-t border-zinc-700 dark:border-zinc-800 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
        <div className="bg-zinc-900 text-zinc-100 font-mono text-[13px] leading-relaxed">
          <div className="flex items-center justify-between gap-2 px-3 py-2 bg-zinc-950 border-b border-zinc-800">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex gap-1.5 shrink-0" aria-hidden>
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/90" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/90" />
              </span>
              <span className="text-zinc-400 truncate text-xs tracking-wide uppercase">
                arclink — mock terminal
              </span>
            </div>
            <span className="text-zinc-500 text-xs tabular-nums hidden sm:inline">
              {logs.length} lines
            </span>
          </div>
          <div
            className="h-[min(40vh,280px)] overflow-y-auto px-3 py-2 whitespace-pre-wrap break-words text-emerald-100/95 selection:bg-purple-500/40"
            role="log"
            aria-live="polite"
          >
            {logs.map((line, i) => (
              <div key={i} className="py-0.5">
                {line}
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>
        </div>
      </div>
    </main>
  );
}
