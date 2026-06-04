import { NextResponse } from "next/server";
import { listTransactionsForUser } from "@/lib/transactions";

export const runtime = "nodejs";

type ListTransactionsBody = {
  user_id?: string;
  limit?: number;
};

export async function POST(request: Request) {
  let body: ListTransactionsBody;

  try {
    body = (await request.json()) as ListTransactionsBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const userId = body.user_id?.trim();

  if (!userId) {
    return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  }

  try {
    const transactions = await listTransactionsForUser(
      userId,
      Math.min(Math.max(body.limit ?? 12, 1), 50)
    );

    return NextResponse.json({
      success: true,
      transactions,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Could not load transactions.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
