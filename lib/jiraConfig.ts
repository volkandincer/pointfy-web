type JiraEnvironment = "prod" | "test";

const getAppEnvironment = (): JiraEnvironment => {
  const rawEnv =
    process.env.NEXT_PUBLIC_APP_ENV ||
    process.env.APP_ENV ||
    process.env.NEXT_PUBLIC_JIRA_ENVIRONMENT ||
    process.env.JIRA_ENV ||
    process.env.VERCEL_ENV ||
    "test";

  return rawEnv.toLowerCase().startsWith("prod") ? "prod" : "test";
};

const currentEnv = getAppEnvironment();

const getEnvValue = (baseKey: string): string | undefined => {
  if (currentEnv === "prod") {
    return (
      process.env[`${baseKey}_PROD`] ??
      process.env[baseKey] ??
      process.env[`${baseKey}_TEST`]
    );
  }

  return (
    process.env[`${baseKey}_TEST`] ??
    process.env[baseKey] ??
    process.env[`${baseKey}_PROD`]
  );
};

export const jiraConfig = {
  env: currentEnv,
  clientId: getEnvValue("JIRA_CLIENT_ID"),
  clientSecret: getEnvValue("JIRA_CLIENT_SECRET"),
  appUrl:
    getEnvValue("NEXT_PUBLIC_APP_URL") ||
    (currentEnv === "prod"
      ? process.env.NEXT_PUBLIC_APP_URL || "https://pointfy-web.vercel.app"
      : "http://localhost:3000"),
};

export const pickJiraEnvValue = (
  baseKey: string,
  fallback?: string
): string | undefined => getEnvValue(baseKey) ?? fallback;

export type { JiraEnvironment };

