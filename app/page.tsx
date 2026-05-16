import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/85 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/85">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-xl font-black tracking-tight text-zinc-950 transition hover:text-purple-700 dark:text-white dark:hover:text-purple-300 sm:text-2xl"
          >
            ARCLINK
          </Link>

          <nav className="flex items-center gap-3">
            <Link
              href="/auth"
              className="text-sm font-semibold text-zinc-800 transition hover:text-zinc-950 dark:text-zinc-200 dark:hover:text-white"
            >
              Login
            </Link>
            <Link
              href="/auth"
              className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-20">
          <div
            className="hero-bg-slide absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/arclinllatest.avif')" }}
          />
          <div
            className="hero-bg-slide absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/arcimage1.webp')" }}
          />
          <div
            className="hero-bg-slide absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/arclink2.webp')" }}
          />
        </div>
        <div className="absolute inset-0 -z-10 bg-white/88 backdrop-blur-[1px] dark:bg-zinc-950/82" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(147,51,234,0.16),transparent_34%),linear-gradient(90deg,rgba(255,255,255,0.96),rgba(255,255,255,0.72),rgba(255,255,255,0.9))] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(168,85,247,0.18),transparent_34%),linear-gradient(90deg,rgba(9,9,11,0.96),rgba(9,9,11,0.72),rgba(9,9,11,0.9))]" />

        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-purple-700 dark:text-purple-300">
              Arc Testnet USDC payments
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight tracking-tight text-zinc-950 dark:text-white sm:text-5xl lg:text-6xl">
              Get Paid Globally in{" "}
              <span className="text-purple-600 dark:text-purple-400">USDC</span>.
              <br />
              Built for African Freelancers.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-700 dark:text-zinc-300 sm:text-lg">
              ARCLINK lets you generate payment links, receive USDC instantly,
              and manage your wallet without seed phrases or complicated crypto
              steps.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/auth"
                className="rounded-lg bg-purple-600 px-6 py-3 text-center font-semibold text-white shadow-sm transition hover:bg-purple-500 dark:bg-purple-500 dark:hover:bg-purple-400"
              >
                Create Free Account
              </Link>
              <Link
                href="#how"
                className="rounded-lg border border-zinc-300 px-6 py-3 text-center font-semibold text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-900"
              >
                How it works
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-950">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">
                  Payment request
                </p>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  Ready
                </span>
              </div>
              <p className="mt-5 text-4xl font-black tabular-nums text-zinc-950 dark:text-white">
                250.00 <span className="text-xl text-purple-600">USDC</span>
              </p>
              <div className="mt-6 space-y-3">
                <div className="h-3 w-full rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-3 w-4/5 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-3 w-2/3 rounded-full bg-zinc-200 dark:bg-zinc-800" />
              </div>
              <div className="mt-6 rounded-lg bg-zinc-950 p-4 text-white dark:bg-white dark:text-zinc-950">
                <p className="text-xs font-bold uppercase tracking-wide opacity-70">
                  Arc wallet
                </p>
                <p className="mt-2 break-all font-mono text-sm font-semibold">
                  0x8F42...A91C
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="how"
        className="border-y border-zinc-200 bg-zinc-100 px-4 py-16 dark:border-zinc-800 dark:bg-zinc-900 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-white">
            How ARCLINK Works
          </h2>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <FeatureCard
              title="1. Sign up"
              text="Create an account using email. No seed phrase required."
            />
            <FeatureCard
              title="2. Get your wallet"
              text="ARCLINK creates your Circle wallet instantly on Arc."
            />
            <FeatureCard
              title="3. Share payment link"
              text="Send your payment link to clients and receive USDC instantly."
            />
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16 dark:bg-zinc-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wide text-purple-700 dark:text-purple-300">
              Why freelancers can trust it
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 dark:text-white">
              Built like a payment tool, not a crypto maze.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              title="No seed phrases"
              text="Dynamic handles onboarding while Circle wallet creation stays server-side."
            />
            <FeatureCard
              title="USDC-first"
              text="Every payment flow is designed around stable Arc Testnet USDC payments."
            />
            <FeatureCard
              title="Client-ready links"
              text="Share a clean checkout page with amount, title, QR code, and wallet address."
            />
            <FeatureCard
              title="Clear receipts"
              text="Successful sends show receipt details with transaction IDs for follow-up."
            />
          </div>
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-zinc-100 px-4 py-16 dark:border-zinc-800 dark:bg-zinc-900 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-purple-700 dark:text-purple-300">
              Creator revenue model
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 dark:text-white">
              Simple pricing that can grow with usage.
            </h2>
            <p className="mt-4 leading-7 text-zinc-700 dark:text-zinc-300">
              Start with a free beta on testnet. When mainnet and off-ramp
              support are ready, ARCLINK can earn from successful payments and
              premium freelancer tools.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
            <FeatureCard
              title="Free beta"
              text="Let freelancers create wallets and links while you validate real demand."
            />
            <FeatureCard
              title="Success fee"
              text="Charge a small percentage only when a client payment succeeds."
            />
            <FeatureCard
              title="Pro invoices"
              text="Sell branded invoices, exports, reminders, and payment tracking later."
            />
            <FeatureCard
              title="Off-ramp fee"
              text="When local withdrawals arrive, charge for faster or easier cash-out."
            />
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16 dark:bg-zinc-950 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-purple-700 dark:text-purple-300">
              Getting money out
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 dark:text-white">
              Give users a clear path after they get paid.
            </h2>
            <p className="mt-4 leading-7 text-zinc-700 dark:text-zinc-300">
              For now, users can receive USDC and send it to another Arc
              Testnet address. The product should clearly explain future
              options like exchange transfer, local bank withdrawal, or mobile
              money off-ramp once those integrations are ready.
            </p>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <div className="grid gap-3">
              <WorkflowStep label="1" title="Client pays link" />
              <WorkflowStep label="2" title="Freelancer receives USDC" />
              <WorkflowStep label="3" title="Funds show in ARCLINK wallet" />
              <WorkflowStep label="4" title="Send to exchange or future off-ramp" />
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-200 bg-white px-4 py-8 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4">
          <p className="font-medium">
            (c) {new Date().getFullYear()} ARCLINK. All rights reserved.
          </p>
          <p className="font-medium">Built on Arc + USDC</p>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-950">
      <h3 className="font-bold text-zinc-950 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
        {text}
      </p>
    </div>
  );
}

function WorkflowStep({ label, title }: { label: string; title: string }) {
  return (
    <div className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-sm dark:bg-zinc-950">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-600 text-sm font-black text-white">
        {label}
      </span>
      <p className="font-bold text-zinc-950 dark:text-white">{title}</p>
    </div>
  );
}
