import type { NextConfig } from "next";

// Production notes: see docs/DEPLOY.md. Secrets are read at request time from
// the host's environment (META_API_KEY, MOCK_MODE); nothing is baked into the build.
const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // The voice note needs the microphone; photos use the file picker.
          { key: "Permissions-Policy", value: "microphone=(self), camera=(self), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
