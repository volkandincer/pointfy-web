import { getSupabase } from "@/lib/supabase";

/**
 * Current Supabase session's access token, or null if signed out.
 * Used to authenticate requests to our own API routes — those routes verify
 * this token server-side rather than trusting a client-supplied user id.
 */
export async function getAccessToken(): Promise<string | null> {
  const supabase = getSupabase();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/**
 * fetch() wrapper that attaches the current Supabase session as a Bearer
 * token, so our API routes can verify the caller's identity server-side.
 */
export async function authFetch(
  input: string,
  init: RequestInit = {}
): Promise<Response> {
  const accessToken = await getAccessToken();
  const headers = new Headers(init.headers);
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return fetch(input, { ...init, headers });
}
