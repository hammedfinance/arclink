import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getOrCreateUserWallet,
  serializeUserWallet,
} from "@/lib/userWallets";

export const runtime = "nodejs";

type SignupBody = {
  email?: string;
  password?: string;
  fullName?: string;
};

function createSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  const projectUrl = url
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");

  return createClient(projectUrl, anonKey);
}

export async function POST(request: Request) {
  let body: SignupBody;
  try {
    body = (await request.json()) as SignupBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  const fullName = body.fullName?.trim();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  try {
    const supabase = createSupabaseServer();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: fullName ? { full_name: fullName } : undefined,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const user = data.user;
    const session = data.session;
    const savedWallet = user
      ? await getOrCreateUserWallet(user.id, user.email ?? email)
      : null;

    return NextResponse.json(
      {
        user: user
          ? {
              id: user.id,
              email: user.email,
            }
          : null,
        session: session
          ? {
              access_token: session.access_token,
              expires_at: session.expires_at,
            }
          : null,
        wallet: savedWallet ? serializeUserWallet(savedWallet) : null,
        wallets: savedWallet ? [serializeUserWallet(savedWallet)] : [],
        message: session
          ? "Account and wallet created."
          : "Account and wallet created. Check your email to confirm your account before signing in.",
      },
      { status: 201 }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Signup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
