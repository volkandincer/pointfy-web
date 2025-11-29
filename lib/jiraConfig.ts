import { appEnvironment, resolveEnvValue } from "@/lib/appEnvironment";

export const jiraConfig = {
  env: appEnvironment,
  clientId: resolveEnvValue("JIRA_CLIENT_ID"),
  clientSecret: resolveEnvValue("JIRA_CLIENT_SECRET"),
  appUrl:
    resolveEnvValue("NEXT_PUBLIC_APP_URL") ||
    (appEnvironment === "prod"
      ? "https://pointfy-web.vercel.app"
      : "http://localhost:3000"),
};
