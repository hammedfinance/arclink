import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseClient";

export const runtime = "nodejs";

type CreatePaymentBody = {
  user_id?: string;
  title?: string;
  amount?: string | number;
};

function generateSlug(): string {
  return Math.random().toString(36).slice(2, 10);
}

async function slugExists(slug: string): Promise<boolean> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("payment_links")
    .select("slug")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

async function createUniqueSlug(): Promise<string> {
  for (let i = 0; i < 5; i += 1) {
    const slug = generateSlug();

    if (!(await slugExists(slug))) {
      return slug;
    }
  }

  return crypto.randomUUID().replace(/-/g, "").slice(0, 10);
}

export async function POST(request: Request) {
  let body: CreatePaymentBody;

  try {
    body = (await request.json()) as CreatePaymentBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const userId = body.user_id?.trim();
  const title = body.title?.trim();
  const amount = String(body.amount ?? "").trim();

  if (!userId || !title || !amount) {
    return NextResponse.json(
      { error: "Missing user_id, title, or amount" },
      { status: 400 }
    );
  }

  if (Number.isNaN(Number(amount)) || Number(amount) <= 0) {
    return NextResponse.json(
      { error: "Amount must be greater than 0" },
      { status: 400 }
    );
  }

  try {
    const slug = await createUniqueSlug();
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("payment_links")
      .insert({
        user_id: userId,
        slug,
        title,
        amount,
        status: "open",
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      paymentLink: data,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Could not create payment link.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
