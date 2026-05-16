import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseClient";

export const runtime = "nodejs";

type ProfileBody = {
  user_id?: string;
  username?: string;
};

type UserRow = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  username?: string | null;
};

function cleanUsername(value?: string) {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}

function validateUsername(username: string) {
  if (username.length < 3) {
    return "Username must be at least 3 characters.";
  }

  if (username.length > 32) {
    return "Username must be 32 characters or fewer.";
  }

  if (!/^[a-zA-Z0-9._ -]+$/.test(username)) {
    return "Username can only use letters, numbers, spaces, dots, underscores, or hyphens.";
  }

  return "";
}

async function saveWithUsernameColumn(userId: string, username: string) {
  const supabase = createSupabaseServerClient();
  return supabase
    .from("users")
    .update({
      username,
      full_name: username,
    })
    .eq("id", userId)
    .select("*")
    .single();
}

async function saveWithFullNameFallback(userId: string, username: string) {
  const supabase = createSupabaseServerClient();
  return supabase
    .from("users")
    .update({
      full_name: username,
    })
    .eq("id", userId)
    .select("*")
    .single();
}

export async function POST(request: Request) {
  let body: ProfileBody;

  try {
    body = (await request.json()) as ProfileBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const userId = body.user_id?.trim();
  const username = cleanUsername(body.username);
  const validationError = validateUsername(username);

  if (!userId) {
    return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  }

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const primary = await saveWithUsernameColumn(userId, username);

    if (!primary.error) {
      return NextResponse.json({
        success: true,
        user: primary.data as UserRow,
      });
    }

    const fallback = await saveWithFullNameFallback(userId, username);

    if (fallback.error) {
      throw new Error(primary.error.message);
    }

    return NextResponse.json({
      success: true,
      user: {
        ...(fallback.data as UserRow),
        username,
      },
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Could not update username.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
