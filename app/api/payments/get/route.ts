import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseClient";

export const runtime = "nodejs";

type GetPaymentBody = {
  slug?: string;
};

export async function POST(request: Request) {
  let body: GetPaymentBody;

  try {
    body = (await request.json()) as GetPaymentBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const slug = body.slug?.trim();

  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  try {
    const supabase = createSupabaseServerClient();
    const payment = await supabase
      .from("payment_links")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (payment.error) {
      throw new Error(payment.error.message);
    }

    if (!payment.data) {
      return NextResponse.json(
        { error: "Payment link not found" },
        { status: 404 }
      );
    }

    const wallet = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", payment.data.user_id)
      .maybeSingle();

    if (wallet.error) {
      throw new Error(wallet.error.message);
    }

    const user = await supabase
      .from("users")
      .select("*")
      .eq("id", payment.data.user_id)
      .maybeSingle();

    if (user.error) {
      throw new Error(user.error.message);
    }

    return NextResponse.json({
      success: true,
      paymentLink: payment.data,
      user: user.data,
      wallet: wallet.data,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Could not load payment link.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
