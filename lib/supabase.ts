import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Server-side için

let client: SupabaseClient | null = null;
let serviceClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
      );
    }
    client = createClient(supabaseUrl, supabaseAnonKey);
  }
  return client;
}

/**
 * Server-side için service role key ile Supabase client'ı
 * RLS policy'leri bypass eder
 */
export function getSupabaseServer(): SupabaseClient {
  if (!serviceClient) {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error(
        "Supabase service role key missing. Set SUPABASE_SERVICE_ROLE_KEY for server-side operations"
      );
    }
    serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return serviceClient;
}
