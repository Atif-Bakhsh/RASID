import type { NextConfig } from "next";

import { getApiBaseUrl } from "./src/config/env";

// Fail the build early instead of shipping a client that cannot reach its API.
getApiBaseUrl();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
