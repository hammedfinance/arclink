"use client";

import { motion } from "framer-motion";
import type { Transition } from "framer-motion";
import Link from "next/link";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

type Tone = "blue" | "slate" | "red" | "amber";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const smoothTransition: Transition = { duration: 0.55, ease: "easeOut" };

export const pageTransition = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: smoothTransition,
};

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-slate-50">
      <div className="pointer-events-none fixed inset-0 -z-30 bg-[#020617]" />
      <div className="arclink-grid pointer-events-none fixed inset-0 -z-20 opacity-45" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_14%_8%,rgba(37,99,235,0.28),transparent_28%),radial-gradient(circle_at_86%_18%,rgba(96,165,250,0.18),transparent_26%),linear-gradient(180deg,rgba(2,6,23,0.3),#020617_58%)]" />
      {children}
    </main>
  );
}

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#020617]/72 backdrop-blur-2xl">
      <Container className="flex items-center justify-between py-4">
        <Brand />
        <nav className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.05] p-1.5 shadow-2xl shadow-black/20">
          <NavPill href="/auth">Login</NavPill>
          <ButtonLink href="/auth" size="sm">
            Get Started
          </ButtonLink>
        </nav>
      </Container>
    </header>
  );
}

export function ProductNav({
  action,
  label = "Dashboard",
  userLabel,
}: {
  action?: ReactNode;
  label?: string;
  userLabel?: string;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#020617]/76 backdrop-blur-2xl">
      <Container className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="flex min-w-0 items-center gap-4">
          <Brand />
          <span className="hidden h-5 w-px bg-white/[0.12] sm:block" />
          <span className="hidden truncate text-sm font-semibold text-slate-400 sm:block">
            {label}
          </span>
        </div>
        <div className="flex min-w-0 items-center gap-3">
          {userLabel ? (
            <p className="hidden max-w-48 truncate text-sm font-semibold text-slate-300 sm:block">
              {userLabel}
            </p>
          ) : null}
          {action}
        </div>
      </Container>
    </header>
  );
}

export function Brand() {
  return (
    <Link href="/" className="group flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-300/25 bg-blue-500/15 text-sm font-black text-blue-100 shadow-[0_0_36px_rgba(37,99,235,0.36)] transition group-hover:border-blue-200/60 group-hover:bg-blue-500/25">
        A
      </span>
      <span className="text-xl font-black tracking-tight text-white sm:text-2xl">
        ARCLINK
      </span>
    </Link>
  );
}

export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>
      {children}
    </div>
  );
}

export function PageSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cn("py-8 sm:py-10", className)}>{children}</section>;
}

export function MotionPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div {...pageTransition} className={className}>
      {children}
    </motion.div>
  );
}

export function Card({
  children,
  className,
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      whileHover={hover ? { y: -6, scale: 1.01 } : undefined}
      className={cn(
        "rounded-3xl border border-white/[0.08] bg-[#111827]/78 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-6",
        hover && "transition-colors hover:border-blue-300/28 hover:bg-[#172033]/88",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
}) {
  return (
    <button
      {...props}
      className={cn(buttonClass(variant, size), className)}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  children,
  href,
  variant = "primary",
  size = "md",
  className,
}: {
  children: ReactNode;
  href: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <Link href={href} className={cn(buttonClass(variant, size), className)}>
      {children}
    </Link>
  );
}

export function NavPill({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-full px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
    >
      {children}
    </Link>
  );
}

function buttonClass(variant: string, size: string) {
  return cn(
    "inline-flex items-center justify-center rounded-2xl text-center font-bold transition duration-300 disabled:cursor-not-allowed disabled:opacity-55",
    size === "sm" ? "px-4 py-2 text-sm" : "px-5 py-3 text-sm",
    variant === "primary" &&
      "arclink-gradient bg-gradient-to-r from-[#2563EB] via-[#1D4ED8] to-[#60A5FA] text-white shadow-[0_16px_48px_rgba(37,99,235,0.32)] hover:-translate-y-0.5 hover:shadow-[0_20px_60px_rgba(37,99,235,0.44)]",
    variant === "secondary" &&
      "border border-white/[0.1] bg-white/[0.06] text-white shadow-2xl shadow-black/15 hover:-translate-y-0.5 hover:border-blue-300/35 hover:bg-white/[0.1]",
    variant === "ghost" &&
      "border border-white/[0.08] bg-transparent text-slate-200 hover:bg-white/[0.08] hover:text-white",
    variant === "danger" &&
      "border border-red-400/20 bg-red-500/15 text-red-100 hover:bg-red-500/22"
  );
}

export function Field({
  label,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-200">{label}</span>
      <input
        {...props}
        className={cn(
          "mt-2 w-full rounded-2xl border border-white/[0.08] bg-[#0F172A]/90 px-4 py-3 font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-blue-300/45 focus:ring-4 focus:ring-blue-500/15",
          className
        )}
      />
    </label>
  );
}

export function TextareaField({
  label,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-200">{label}</span>
      <textarea
        {...props}
        className={cn(
          "mt-2 min-h-28 w-full rounded-2xl border border-white/[0.08] bg-[#0F172A]/90 px-4 py-3 font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-blue-300/45 focus:ring-4 focus:ring-blue-500/15",
          className
        )}
      />
    </label>
  );
}

export function Alert({
  children,
  tone = "blue",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm font-semibold",
        tone === "blue" && "border-blue-300/20 bg-blue-500/12 text-blue-100",
        tone === "slate" && "border-white/[0.08] bg-white/[0.055] text-slate-300",
        tone === "red" && "border-red-400/20 bg-red-500/12 text-red-100",
        tone === "amber" && "border-amber-300/20 bg-amber-400/12 text-amber-100",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "blue",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide",
        tone === "blue" && "border-blue-300/25 bg-blue-500/14 text-blue-100",
        tone === "slate" && "border-white/[0.08] bg-white/[0.06] text-slate-300",
        tone === "red" && "border-red-400/20 bg-red-500/14 text-red-100",
        tone === "amber" && "border-amber-300/20 bg-amber-400/14 text-amber-100"
      )}
    >
      {children}
    </span>
  );
}

export function MetricCard({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <Card hover className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/70 to-transparent" />
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mt-3 text-3xl font-black tracking-tight text-white tabular-nums"
      >
        {value} {suffix ? <span className="text-lg text-blue-200">{suffix}</span> : null}
      </motion.p>
    </Card>
  );
}

export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-white/[0.12] bg-white/[0.04] p-8 text-center">
      <p className="text-lg font-black text-white">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">{text}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-white/[0.07]", className)}>
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.09] to-transparent [animation:shimmer_1.7s_infinite]" />
    </div>
  );
}

export function Modal({
  children,
  title,
  eyebrow,
  onClose,
}: {
  children: ReactNode;
  title: string;
  eyebrow?: string;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#020617]/72 px-4 py-4 backdrop-blur-md sm:items-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        role="dialog"
        aria-modal="true"
        className="w-full max-w-lg rounded-3xl border border-white/[0.08] bg-[#111827] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.55)] sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            {eyebrow ? (
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-200">
                {eyebrow}
              </p>
            ) : null}
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
              {title}
            </h2>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="mt-5">{children}</div>
      </motion.div>
    </motion.div>
  );
}

export function DataRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.045] p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <div
        className={cn(
          "mt-2 break-all text-sm font-semibold leading-6 text-slate-100",
          mono && "font-mono text-xs"
        )}
      >
        {value}
      </div>
    </div>
  );
}
