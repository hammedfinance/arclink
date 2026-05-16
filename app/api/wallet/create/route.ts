import { NextResponse } from "next/server";
import { createCircleWalletForUser } from "@/lib/circleWallet";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      userId?: string;
      email?: string;
    };
    const result = await createCircleWalletForUser(
      body.userId?.trim() || crypto.randomUUID(),
      body.email?.trim()
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (e: unknown) {
    const err = e as { message?: string; status?: number; code?: number };
    const message = err?.message ?? String(e);
    const status =
      typeof err?.status === "number" && err.status >= 400 && err.status < 600
        ? err.status
        : 502;
    return NextResponse.json(
      { error: message, code: err?.code },
      { status }
    );
  }
}
