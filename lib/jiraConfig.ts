import { appEnvironment, resolveEnvValue } from "@/lib/appEnvironment";

/**
 * Request'ten dinamik olarak app URL'ini alır
 * Güvenlik: Sadece whitelist'teki domain'lere izin verir
 */
export function getAppUrlFromRequest(request: Request): string {
  const url = new URL(request.url);
  const origin = url.origin;
  
  // Env'den fallback al
  const envAppUrl = resolveEnvValue("NEXT_PUBLIC_APP_URL");
  
  // Vercel'de otomatik URL detection
  const vercelUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}`
    : null;
  
  // Güvenlik: Whitelist kontrolü (opsiyonel, production için önerilir)
  const allowedHosts = [
    "localhost:3000",
    "localhost",
    "pointfy.app",
    "www.pointfy.app",
    "pointfy-web.vercel.app",
    // Custom domain'ler buraya eklenebilir
  ];
  
  const host = url.host;
  const isAllowed = allowedHosts.some(allowed => 
    host === allowed || host.endsWith(`.${allowed}`)
  );
  
  // Öncelik sırası:
  // 1. Request'ten gelen origin (whitelist kontrolü ile)
  // 2. VERCEL_URL (Vercel'de otomatik)
  // 3. Env variable
  // 4. Fallback (environment'a göre)
  
  if (isAllowed || process.env.NODE_ENV === "development") {
    return origin;
  }
  
  if (vercelUrl) {
    return vercelUrl;
  }
  
  if (envAppUrl) {
    return envAppUrl;
  }
  
  // Fallback
  return appEnvironment === "prod"
    ? "https://pointfy.app"
    : "http://localhost:3000";
}

export const jiraConfig = {
  env: appEnvironment,
  clientId: resolveEnvValue("JIRA_CLIENT_ID"),
  clientSecret: resolveEnvValue("JIRA_CLIENT_SECRET"),
  // appUrl artık request'ten dinamik alınacak, bu sadece fallback
  getAppUrl: (request?: Request): string => {
    if (request) {
      return getAppUrlFromRequest(request);
    }
    // Fallback: Env'den veya default
    return (
      resolveEnvValue("NEXT_PUBLIC_APP_URL") ||
      (appEnvironment === "prod"
        ? "https://pointfy.app"
        : "http://localhost:3000")
    );
  },
};
