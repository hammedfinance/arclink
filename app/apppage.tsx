export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <header className="flex items-center justify-between px-8 py-6 border-b">
        <h1 className="text-2xl font-bold">ARCLINK</h1>

        <nav className="flex gap-4">
          <a href="/auth" className="text-sm font-medium hover:underline">
            Login
          </a>
          <a
            href="/auth"
            className="bg-black text-white px-4 py-2 rounded-xl text-sm font-medium"
          >
            Get Started
          </a>
        </nav>
      </header>

      <section className="px-8 py-20 max-w-5xl mx-auto">
        <h2 className="text-5xl font-bold leading-tight">
          Get Paid Globally in <span className="text-purple-600">USDC</span>.
          <br />
          Built for African Freelancers.
        </h2>

        <p className="mt-6 text-lg text-gray-600 max-w-2xl">
          ARCLINK lets you generate payment links, receive USDC instantly, and
          manage your wallet without seed phrases or complicated crypto steps.
        </p>

        <div className="mt-8 flex gap-4">
          <a
            href="/auth"
            className="bg-purple-600 text-white px-6 py-3 rounded-2xl font-medium"
          >
            Create Free Account
          </a>
          <a
            href="#how"
            className="border border-gray-300 px-6 py-3 rounded-2xl font-medium"
          >
            How it works
          </a>
        </div>
      </section>

      <section id="how" className="px-8 py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-3xl font-bold">How ARCLINK Works</h3>

          <div className="grid md:grid-cols-3 gap-6 mt-10">
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
              <h4 className="font-semibold text-lg">1. Sign up</h4>
              <p className="mt-2 text-gray-600">
                Create an account using email. No seed phrase required.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border">
              <h4 className="font-semibold text-lg">2. Get your wallet</h4>
              <p className="mt-2 text-gray-600">
                ARCLINK creates your smart wallet instantly on Arc.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border">
              <h4 className="font-semibold text-lg">3. Share payment link</h4>
              <p className="mt-2 text-gray-600">
                Send your payment link to clients and receive USDC instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="px-8 py-10 border-t text-sm text-gray-500">
        <div className="max-w-5xl mx-auto flex justify-between">
          <p>© {new Date().getFullYear()} ARCLINK. All rights reserved.</p>
          <p>Built on Arc + USDC</p>
        </div>
      </footer>
    </main>
  );
}
