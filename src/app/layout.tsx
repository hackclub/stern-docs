import type { Metadata, Viewport } from "next";
import {
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  IBM_Plex_Sans_Condensed,
} from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { Insight } from "@/components/insight";
import { BOOT_SCRIPT } from "@/lib/boot-script";
import {
  AUTHOR_NAME,
  AUTHOR_URL,
  HACK_CLUB_RED,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site";
import "./globals.css";

/**
 * IBM Plex, in three voices. Plex was drawn for machines and their manuals, and
 * this whole site is a manual for machines people run themselves  the
 * condensed cut does the silkscreened panel labels, the mono does readouts and
 * code, and the sans carries the prose. One family keeps a program's docs
 * coherent no matter which brand color the artwork hands it.
 */
const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
  display: "swap",
});

const condensed = IBM_Plex_Sans_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-plex-condensed",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

/**
 * Site-wide defaults. A program's layout narrows every one of these to its own
 * name, icon and colour; this is what the pages that belong to no program
 * (/embed, 404) wear, and what a crawler sees before a program says otherwise.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: "%s" },
  description: "Documentation for Hack Club program participants.",
  applicationName: SITE_NAME,
  authors: [{ name: AUTHOR_NAME, url: AUTHOR_URL }],
  creator: AUTHOR_NAME,
  publisher: "Hack Club",
  category: "technology",
  referrer: "strict-origin-when-cross-origin",
  formatDetection: { telephone: false, address: false, email: false },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: { type: "website", siteName: SITE_NAME, locale: "en_US" },
  twitter: { card: "summary_large_image" },
  manifest: "/manifest.webmanifest",
  alternates: { types: { "text/plain": "/llms.txt" } },
};

/** Hack Club red until a program's layout swaps in its own brand colour. */
export const viewport: Viewport = {
  themeColor: HACK_CLUB_RED,
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${condensed.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
      </head>
      <body>
        {children}
        <Insight />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
