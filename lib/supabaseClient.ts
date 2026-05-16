import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function normalizeSupabaseUrl(raw: string): string {
  return raw
    .trim()
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
}

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url?.trim() || !anonKey?.trim()) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Add them to .env.local."
    );
  }

  return {
    url: normalizeSupabaseUrl(url),
    anonKey: anonKey.trim(),
    serviceRoleKey: serviceRoleKey?.trim(),
  };
}

let browserClient: SupabaseClient | null = null;

/** Browser / client components — uses the public anon key. */
export function createSupabaseBrowserClient(): SupabaseClient {
  if (typeof window === "undefined") {
    throw new Error(
      "createSupabaseBrowserClient() is for client components only. Use createSupabaseServerClient() in Server Components or route handlers."
    );
  }

  if (!browserClient) {
    const { url, anonKey } = getEnv();
    browserClient = createClient(url, anonKey);
  }

  return browserClient;
}

/** Server Components, route handlers, and scripts — same anon key unless you add a service role later. */
export function createSupabaseServerClient(): SupabaseClient {
  const { url, anonKey, serviceRoleKey } = getEnv();
  return createClient(url, serviceRoleKey || anonKey);
}

let sharedClient: SupabaseClient | null = null;

/** Shared singleton (browser or server). Prefer explicit helpers when you need to be sure. */
export function getSupabase(): SupabaseClient {
  if (!sharedClient) {
    const { url, anonKey } = getEnv();
    sharedClient = createClient(url, anonKey);
  }
  return sharedClient;
}
