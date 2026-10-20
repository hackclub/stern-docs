import type { MetadataRoute } from "next";
import { HACK_CLUB_ICON, HACK_CLUB_RED, SITE_NAME } from "@/lib/site";

/**
 * Enough of a web manifest for "add to home screen" and for crawlers that read
 * the app name from it. The icons are the site's own mark and the official Hack
 * Club icon; a program's tab icon is set per program in its layout.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "Program docs",
    description: "Documentation for Hack Club program participants.",
    start_url: "/",
    display: "minimal-ui",
    background_color: "#fbf7f6",
    theme_color: HACK_CLUB_RED,
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: HACK_CLUB_ICON, sizes: "any", type: "image/svg+xml" },
    ],
  };
}
