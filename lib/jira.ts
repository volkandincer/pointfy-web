/**
 * Jira OAuth token'ı refresh et
 */
export async function refreshJiraToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}> {
  const response = await fetch("https://auth.atlassian.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = "Token refresh başarısız";
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage =
        errorJson.error_description || errorJson.error || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(
      `Jira token refresh başarısız: ${response.status} ${response.statusText} - ${errorMessage}`
    );
  }

  return (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
}
