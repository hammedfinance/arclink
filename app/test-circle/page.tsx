"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppShell,
  Badge,
  Button,
  Card,
  Container,
  PageSection,
  ProductNav,
} from "@/components/ui/system";

function ts() {
  return new Date().toLocaleTimeString(undefined, { hour12: false });
}

export default function TestCirclePage() {
  const [logs, setLogs] = useState<string[]>([
    `[${ts()}] Ready. Click "Create wallet" to call POST /api/wallet/create.`,
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
    <AppShell>
      <ProductNav label="Circle test" />
      <PageSection>
        <Container className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <Card>
            <Badge>Developer utility</Badge>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white">
              Circle wallet test
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              Output appears in the terminal panel. This calls the existing
              wallet creation endpoint and leaves backend behavior unchanged.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button type="button" onClick={createWallet} disabled={loading}>
                {loading ? "Creating..." : "Create wallet"}
              </Button>
              <Button type="button" variant="secondary" onClick={clearTerminal}>
                Clear terminal
              </Button>
            </div>
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] bg-[#020617] px-4 py-3 font-mono">
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-300/90" />
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500/90" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-500/90" />
                <span className="truncate text-xs uppercase tracking-wide text-slate-400">
                  arclink / mock terminal
                </span>
              </div>
              <span className="hidden text-xs tabular-nums text-slate-500 sm:inline">
                {logs.length} lines
              </span>
            </div>
            <div
              className="arclink-scrollbar h-[min(52vh,420px)] overflow-y-auto whitespace-pre-wrap break-words bg-[#020617]/90 px-4 py-3 font-mono text-[13px] leading-relaxed text-blue-100 selection:bg-blue-500/40"
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
          </Card>
        </Container>
      </PageSection>
    </AppShell>
  );
}
