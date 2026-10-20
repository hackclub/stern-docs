import type { NextConfig } from "next";

/**
 * This site exists to be framed. Every page is embeddable, so framing is
 * allowed globally rather than on one opt-in route the way stern does it for
 * /rudder  but the rest of the header set stays strict, because "anyone may
 * frame us" is the only concession being made here.
 */
const EMBEDDABLE_HEADERS = [
  // No X-Frame-Options: it has no allow-list form, and its presence would
  // override frame-ancestors in older browsers and break the embed.
  { key: "Content-Security-Policy", value: "frame-ancestors *" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

/**
 * The share card reads the Plex fonts, the Hack Club flag and a program's
 * wordmark from disk (lib/og.tsx), by paths it builds at runtime. File tracing
 * can't follow a path it can't see, so the two routes that draw cards are told
 * what to ship.
 */
const OG_ASSETS = [
  "./src/assets/fonts/**/*",
  "./public/brand/**/*",
  "./public/programs/**/*",
];

const nextConfig: NextConfig = {
  images: {
    // Program artwork (logo, banner, background) is served from Hack Club's CDN;
    // the palette extractor reads the same URLs server-side.
    remotePatterns: [
      { protocol: "https", hostname: "cdn.hackclub.com" },
      { protocol: "https", hostname: "hc-cdn.hel1.your-objectstorage.com" },
    ],
  },
  outputFileTracingIncludes: {
    "/og": OG_ASSETS,
    "/\\[program\\]/opengraph-image": OG_ASSETS,
  },
  async headers() {
    return [
      { source: "/:path*", headers: EMBEDDABLE_HEADERS },
      {
        // The embed helper is a script other origins load and re-load often.
        source: "/embed.js",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cache-Control", value: "public, max-age=600, s-maxage=3600" },
        ],
      },
    ];
  },
};

export default nextConfig;
