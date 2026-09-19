import type { NextConfig } from "next";

import { getApiBaseUrl, getApiProxyOrigin } from "./src/config/env";

// Fail the build early instead of shipping a client that cannot reach its API.
getApiBaseUrl();
const apiProxyOrigin = getApiProxyOrigin();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async rewrites() {
    if (!apiProxyOrigin) return [];

    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiProxyOrigin}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
