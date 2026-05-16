import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseClient";

export const runtime = "nodejs";

type ListPaymentsBody = {
  user_id?: string;
};

export async function POST(request: Request) {
  let body: ListPaymentsBody;

  try {
    body = (await request.json()) as ListPaymentsBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const userId = body.user_id?.trim();

  if (!userId) {
    return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("payment_links")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(8);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      paymentLinks: data ?? [],
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Could not load payment links.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
