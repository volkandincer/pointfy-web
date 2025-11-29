type AppEnvironment = "prod" | "test";

const detectAppEnvironment = (): AppEnvironment => {
  const rawEnv =
    process.env.NEXT_PUBLIC_APP_ENV ||
    process.env.APP_ENV ||
    process.env.NEXT_PUBLIC_JIRA_ENVIRONMENT ||
    process.env.JIRA_ENV ||
    process.env.VERCEL_ENV ||
    "test";

  return rawEnv.toLowerCase().startsWith("prod") ? "prod" : "test";
};

export const appEnvironment = detectAppEnvironment();

const publicEnvStore: Record<string, string | undefined> = {
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_APP_URL_PROD: process.env.NEXT_PUBLIC_APP_URL_PROD,
  NEXT_PUBLIC_APP_URL_TEST: process.env.NEXT_PUBLIC_APP_URL_TEST,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SITE_URL_PROD: process.env.NEXT_PUBLIC_SITE_URL_PROD,
  NEXT_PUBLIC_SITE_URL_TEST: process.env.NEXT_PUBLIC_SITE_URL_TEST,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_URL_PROD: process.env.NEXT_PUBLIC_SUPABASE_URL_PROD,
  NEXT_PUBLIC_SUPABASE_URL_TEST: process.env.NEXT_PUBLIC_SUPABASE_URL_TEST,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD,
  NEXT_PUBLIC_SUPABASE_ANON_KEY_TEST:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_TEST,
};

const readEnvValue = (key: string): string | undefined => {
  if (key.startsWith("NEXT_PUBLIC_")) {
    return publicEnvStore[key];
  }
  return process.env[key];
};

export const resolveEnvValue = (
  baseKey: string,
  fallback?: string
): string | undefined => {
  const suffixPreferred = appEnvironment === "prod" ? "_PROD" : "_TEST";
  const suffixAlternate = appEnvironment === "prod" ? "_TEST" : "_PROD";

  return (
    readEnvValue(`${baseKey}${suffixPreferred}`) ??
    readEnvValue(baseKey) ??
    readEnvValue(`${baseKey}${suffixAlternate}`) ??
    fallback
  );
};

export const isProdEnvironment = appEnvironment === "prod";

export type { AppEnvironment };
