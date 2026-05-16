import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseClient";
import {
  getOrCreateUserWallet,
  serializeUserWallet,
} from "@/lib/userWallets";

export const runtime = "nodejs";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  let body: LoginBody;

  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const wallet = data.user
      ? await getOrCreateUserWallet(data.user.id, data.user.email ?? email)
      : null;

    return NextResponse.json({
      user: data.user
        ? {
            id: data.user.id,
            email: data.user.email,
          }
        : null,
      session: data.session
        ? {
            access_token: data.session.access_token,
            expires_at: data.session.expires_at,
          }
        : null,
      wallet: wallet ? serializeUserWallet(wallet) : null,
      message: "Logged in.",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
