"use client";

import { motion } from "framer-motion";
import {
  AppShell,
  Badge,
  ButtonLink,
  Card,
  Container,
  MarketingNav,
  MotionPanel,
} from "@/components/ui/system";

const featureCards = [
  {
    title: "Email-first payments",
    text: "Create a request, send it to an email address, and let ARCLINK convert that intent into a clean USDC payment flow.",
  },
  {
    title: "Invisible payment rails",
    text: "Circle wallets and settlement infrastructure run quietly in the background while users see names, emails, balances, and receipts.",
  },
  {
    title: "Built for real payouts",
    text: "Payment links, QR codes, direct sends, and receipts are designed for teams that want USDC without a crypto learning curve.",
  },
];

const stats = [
  ["04 sec", "link creation"],
  ["USDC", "native asset"],
  ["Email", "recipient handle"],
];

export default function Home() {
  return (
    <AppShell>
      <MarketingNav />

      <section className="relative min-h-[calc(100vh-73px)] overflow-hidden">
        <div className="absolute inset-0 -z-20">
          <div
            className="hero-bg-slide absolute inset-0 scale-105 bg-cover bg-center opacity-80 blur-sm"
            style={{ backgroundImage: "url('/images/arclinllatest.avif')" }}
          />
          <div
            className="hero-bg-slide absolute inset-0 scale-105 bg-cover bg-center opacity-80 blur-sm"
            style={{ backgroundImage: "url('/images/arcimage1.webp')" }}
          />
          <div
            className="hero-bg-slide absolute inset-0 scale-105 bg-cover bg-center opacity-80 blur-sm"
            style={{ backgroundImage: "url('/images/arclink2.webp')" }}
          />
        </div>
        <div className="absolute inset-0 -z-10 bg-[#020617]/88" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_18%,rgba(37,99,235,0.34),transparent_30%),radial-gradient(circle_at_80%_12%,rgba(96,165,250,0.22),transparent_28%),linear-gradient(135deg,rgba(2,6,23,0.68),#020617_62%)]" />

        <Container className="grid min-h-[calc(100vh-73px)] items-center gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
          <MotionPanel>
            <Badge>USDC-native payment network</Badge>
            <h1 className="mt-7 max-w-5xl text-5xl font-black leading-[0.94] tracking-tight text-white sm:text-7xl lg:text-8xl">
              Send payments with just an email address.
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              ARCLINK gives freelancers and global teams a premium payment
              workspace for creating links, receiving USDC, and sending funds
              by email without exposing users to crypto complexity.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/auth">Create Free Account</ButtonLink>
              <ButtonLink href="#platform" variant="secondary">
                Explore Platform
              </ButtonLink>
            </div>
            <div className="mt-9 grid max-w-2xl gap-3 sm:grid-cols-3">
              {stats.map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-3xl border border-white/[0.08] bg-white/[0.055] p-4 backdrop-blur-xl"
                >
                  <p className="text-2xl font-black text-white">{value}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </MotionPanel>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 26 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.75, ease: "easeOut", delay: 0.12 }}
            className="relative mx-auto w-full max-w-xl lg:mx-0"
          >
            <div className="absolute -inset-6 rounded-[2rem] bg-blue-500/20 blur-3xl" />
            <Card className="relative overflow-hidden p-4 sm:p-5">
              <div className="rounded-[1.5rem] border border-white/[0.08] bg-[#0F172A]/88 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-200">
                      Payment request
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-400">
                      Sent to client@studio.co
                    </p>
                  </div>
                  <Badge>Ready</Badge>
                </div>
                <div className="mt-8 rounded-3xl border border-white/[0.08] bg-white/[0.055] p-5">
                  <p className="text-sm font-semibold text-slate-400">Amount</p>
                  <p className="mt-2 text-5xl font-black tracking-tight text-white sm:text-6xl">
                    250.00 <span className="text-xl text-blue-200">USDC</span>
                  </p>
                  <div className="mt-6 grid gap-3">
                    <PreviewRow label="Recipient" value="Email address" />
                    <PreviewRow label="Delivery" value="USDC" />
                    <PreviewRow label="Rails" value="Handled automatically" />
                  </div>
                </div>
                <div className="mt-4 rounded-3xl border border-blue-300/18 bg-gradient-to-br from-blue-500/20 to-blue-300/8 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-100">
                    Shareable ARCLINK
                  </p>
                  <p className="mt-3 break-all font-mono text-sm font-semibold text-white">
                    arclink.app/pay/creative-invoice-250
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </Container>
      </section>

      <section id="platform" className="border-y border-white/[0.08] bg-[#0F172A]/52 py-20">
        <Container>
          <div className="max-w-3xl">
            <Badge>Platform</Badge>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
              A production-grade fintech surface for USDC payment operations.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {featureCards.map((feature) => (
              <Card key={feature.title} hover>
                <h3 className="text-xl font-black text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  {feature.text}
                </p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <footer className="border-t border-white/[0.08] py-8 text-sm text-slate-400">
        <Container className="flex flex-wrap items-center justify-between gap-4">
          <p className="font-semibold">
            (c) {new Date().getFullYear()} ARCLINK. All rights reserved.
          </p>
          <p className="font-semibold text-blue-200">Built on Arc + Circle USDC</p>
        </Container>
      </footer>
    </AppShell>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.04] px-4 py-3">
      <span className="text-sm font-semibold text-slate-400">{label}</span>
      <span className="text-sm font-bold text-white">{value}</span>
    </div>
  );
}
