import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // The Dockerfile's runner stage copies .next/standalone; keep this in sync.
  output: "standalone",
  turbopack: {
    root: projectRoot,
  },
  outputFileTracingRoot: projectRoot,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // Caddy replaces this in production; keep the two values identical.
          { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
    ];
  },
  images: {
    // Bundled crests are the only images the optimizer serves.
    localPatterns: [{ pathname: "/crests/**", search: "" }],
  },
};

export default nextConfig;
