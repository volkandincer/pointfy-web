import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Security: Disable source maps in production to prevent exposing source code
  productionBrowserSourceMaps: false,
  
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "secure.gravatar.com",
      },
      {
        protocol: "https",
        hostname: "avatar-management--avatars.us-west-2.prod.public.atl-paas.net",
      },
      {
        protocol: "https",
        hostname: "**.atlassian.com",
      },
    ],
  },
};

export default nextConfig;
