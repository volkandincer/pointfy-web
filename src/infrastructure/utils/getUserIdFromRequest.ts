/**
 * getUserIdFromRequest
 * Derives the authenticated user's id from a Supabase access token.
 *
 * The token must be supplied either via the `Authorization: Bearer <token>`
 * header (preferred, used by all fetch-based API calls) or an `accessToken`
 * query parameter (used only where a header can't be attached, e.g. a
 * top-level browser navigation like the Jira OAuth redirect). The token is
 * always verified against Supabase Auth via `auth.getUser(token)` — a
 * client-supplied `userId` is never accepted as an identity claim, since
 * that would let any caller impersonate any other user.
 */

import { getSupabase } from "@/lib/supabase";

export async function getUserIdFromRequest(
  request: Request
): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : null;

  const { searchParams } = new URL(request.url);
  const token = bearerToken || searchParams.get("accessToken");

  if (!token) {
    return null;
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return null;
    }
    return data.user.id;
  } catch {
    return null;
  }
}
