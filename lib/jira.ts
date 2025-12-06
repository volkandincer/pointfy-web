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
    let errorCode: string | undefined;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage =
        errorJson.error_description || errorJson.error || errorMessage;
      errorCode = errorJson.error;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    
    // 403 Forbidden genellikle refresh_token'ın geçersiz olduğu anlamına gelir
    // Bu durumda kullanıcının Jira'yı yeniden bağlaması gerekir
    if (response.status === 403 || errorCode === "invalid_grant" || errorMessage.includes("refresh_token is invalid")) {
      throw new Error(
        `Jira token refresh başarısız: Refresh token geçersiz. Lütfen Jira bağlantınızı yeniden yapın. (${response.status} ${response.statusText})`
      );
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
