import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { resolveEnvValue } from "@/lib/appEnvironment";

const supabaseUrl = resolveEnvValue("NEXT_PUBLIC_SUPABASE_URL");
const supabaseAnonKey = resolveEnvValue("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const supabaseServiceRoleKey = resolveEnvValue("SUPABASE_SERVICE_ROLE_KEY"); // Server-side için

let client: SupabaseClient | null = null;
let serviceClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL_* ve NEXT_PUBLIC_SUPABASE_ANON_KEY_* değerlerini kontrol edin (bkz. docs/env.md)."
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
        "Supabase service role key missing. SUPABASE_SERVICE_ROLE_KEY_* değerlerini ayarladığınızdan emin olun (docs/env.md)."
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
