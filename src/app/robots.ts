import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Everything is crawlable except the embed variants of a page: `?embed=1` and
 * `?nav=0` serve the same HTML with the chrome hidden, and a crawler that
 * follows them indexes every page twice. The share-card generator and the
 * raw markdown stay open; those carry their own canonical signals.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/*?embed=", "/*&embed=", "/*?nav=", "/*&nav="],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    // Not part of the robots.txt spec, but it's where crawlers already look for
    // extra site metadata.
    host: SITE_URL,
  };
}
