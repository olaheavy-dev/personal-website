import type { NextConfig } from "next";
import { headerRules } from "./src/lib/security/headers";

const nextConfig: NextConfig = {
  // The Docker image ships the minimal standalone server (decision 0003).
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  // The stylesheet (small, Tailwind) goes inside the HTML, so the first paint does not wait for a
  // second round trip on a slow phone connection (LCP, issue #9). Experimental in Next 16.
  experimental: { inlineCss: true },
  // The commit this build came from (the Dockerfile sets BUILD_SHA in its build stage only).
  // Written into the build so /healthz, which runs at request time, can still report it.
  env: { BUILD_SHA: process.env.BUILD_SHA ?? "dev" },
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
