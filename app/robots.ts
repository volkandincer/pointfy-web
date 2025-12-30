import type { MetadataRoute } from "next";
import { resolveEnvValue } from "@/lib/appEnvironment";

const SITE_URL = resolveEnvValue("NEXT_PUBLIC_SITE_URL") || "https://teamhubx.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
