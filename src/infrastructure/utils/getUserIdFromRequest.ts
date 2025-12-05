/**
 * getUserIdFromRequest
 * Utility to extract user ID from Next.js API route request
 */

import { cookies } from "next/headers";
import { getSupabase } from "@/lib/supabase";
import { resolveEnvValue } from "@/lib/appEnvironment";

export async function getUserIdFromRequest(
  request: Request
): Promise<string | null> {
  const { searchParams } = new URL(request.url);
  let userId: string | undefined = searchParams.get("userId") || undefined;

  if (userId) {
    return userId;
  }

  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("sb-access-token")?.value;

    if (accessToken) {
      try {
        const tokenParts = accessToken.split(".");
        if (tokenParts.length === 3) {
          const payload = JSON.parse(
            Buffer.from(tokenParts[1], "base64").toString()
          );
          userId = payload.sub;
          if (userId) {
            return userId;
          }
        }
      } catch {
        // JWT decode failed, continue
      }

      if (!userId) {
        try {
          const supabaseUrl = resolveEnvValue("NEXT_PUBLIC_SUPABASE_URL");
          const supabaseAnonKey = resolveEnvValue("NEXT_PUBLIC_SUPABASE_ANON_KEY");
          if (supabaseUrl && supabaseAnonKey) {
            const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                apikey: supabaseAnonKey,
              },
            });

            if (userResponse.ok) {
              const userData = await userResponse.json();
              if (userData.id) {
                return userData.id;
              }
            }
          }
        } catch {
          // Supabase API error, continue
        }
      }
    }

    if (!userId) {
      const supabase = getSupabase();
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        return user.id;
      }
    }
  } catch {
    // Auth error
  }

  return null;
}

