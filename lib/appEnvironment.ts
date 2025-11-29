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

export const resolveEnvValue = (
  baseKey: string,
  fallback?: string
): string | undefined => {
  const suffixPreferred = appEnvironment === "prod" ? "_PROD" : "_TEST";
  const suffixAlternate = appEnvironment === "prod" ? "_TEST" : "_PROD";

  return (
    process.env[`${baseKey}${suffixPreferred}`] ??
    process.env[baseKey] ??
    process.env[`${baseKey}${suffixAlternate}`] ??
    fallback
  );
};

export type { AppEnvironment };
type AppEnvironment = "prod" | "test";

const getAppEnvironment = (): AppEnvironment => {
  const rawEnv =
    process.env.NEXT_PUBLIC_APP_ENV ||
    process.env.APP_ENV ||
    process.env.NEXT_PUBLIC_JIRA_ENVIRONMENT ||
    process.env.JIRA_ENV ||
    "test";

  return rawEnv.toLowerCase().startsWith("prod") ? "prod" : "test";
};

export const appEnvironment = getAppEnvironment();
export const isProdEnvironment = appEnvironment === "prod";

export type { AppEnvironment };
