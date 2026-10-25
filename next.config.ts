import type { NextConfig } from "next";
import { headerRules } from "./src/lib/security/headers";

const nextConfig: NextConfig = {
  // The Docker image ships the minimal standalone server (decision 0003).
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  // No X-Powered-By: it tells a scanner which framework to try.
  poweredByHeader: false,
  // Security headers (decision 0017). Static rules keep every page prerendered.
  headers: async () => headerRules(),
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
