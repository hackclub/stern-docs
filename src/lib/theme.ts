/**
 * One brand seed → every color on the page, in OKLCH.
 *
 * The shared shadcn-shaped tokens (--background, --card, --primary, …) are
 * generated with the same formulas stern uses in lib/theme-palette.ts, on
 * purpose: when these docs are framed inside a program's stern pages the two
 * surfaces have to look like one product, and matching the *algorithm* keeps
 * them agreeing even after either side changes its brand color.
 *
 * On top of that sit the tokens only the docs need  the panel/hairline/LED
 * language of the sidebar and header. Those are derived from the same seed hue,
 * so a program's docs feel like its own equipment rather than a grey chrome
 * with a colored button in it.
 *
 * **Light only.** There is deliberately no dark variant and no appearance
 * switch: one surface per program means one set of contrast decisions to get
 * right, and an embed inherits its host's page rather than negotiating with it.
 *
 * Pure and deterministic: the server renders these into a <style> tag and
 * nothing recomputes them client-side.
 */

import { clamp, hexToOklch, oklchToHex } from "@/lib/color";

/** What the extractor hands over: a primary brand color and a companion hue. */
export type ThemeSeed = {
  /** Drives text, surfaces and the accent. */
  brand: string;
  /** Second color for the status strip gradient and LED glow. */
  secondary: string;
  /** Where the colors came from  surfaced in the theme debug route. */
  source: "images" | "accent" | "fallback" | "override";
};

export type ThemeVars = Record<string, string>;

const r3 = (n: number) => Math.round(n * 1000) / 1000;
const r1 = (n: number) => Math.round(n * 10) / 10;

function oklch(l: number, c: number, h: number, a?: number): string {
  const base = `${r3(l)} ${r3(c)} ${r1(h)}`;
  return a == null ? `oklch(${base})` : `oklch(${base} / ${a}%)`;
}

export function generateTokens(seed: ThemeSeed): ThemeVars {
  const brand = hexToOklch(seed.brand);
  const second = hexToOklch(seed.secondary);
  const h = brand.h;
  const h2 = second.h;

  // Muted tint chroma scales with how saturated the brand is (a grey brand
  // yields grey neutrals) but is capped so surfaces never turn gaudy.
  const tint = (cap: number) => Math.min(brand.c, cap);

  // The accent itself, nudged into a vivid-but-usable band so a near-black or
  // near-white brand still reads as a deliberate accent.
  const accentL = clamp(brand.l, 0.45, 0.72);
  const accentC = Math.max(brand.c, 0.04);
  const primary = oklch(accentL, accentC, h);
  const primaryFg =
    accentL > 0.62 ? oklch(0.2, tint(0.02), h) : oklch(0.98, tint(0.008), h);

  return {
    "--primary": primary,
    "--primary-foreground": primaryFg,
    "--ring": primary,
    // The brand pair, kept raw for the header seam, LEDs and glows.
    "--brand": oklch(accentL, accentC, h),
    "--brand-2": oklch(
      clamp(second.l, 0.5, 0.78),
      Math.max(second.c, 0.05),
      h2,
    ),

    "--background": oklch(0.975, tint(0.01), h),
    "--foreground": oklch(0.2, tint(0.024), h),
    "--card": oklch(0.995, tint(0.006), h),
    "--card-foreground": oklch(0.2, tint(0.024), h),
    "--popover": oklch(0.995, tint(0.006), h),
    "--popover-foreground": oklch(0.2, tint(0.024), h),
    "--secondary": oklch(0.95, tint(0.03), h),
    "--secondary-foreground": oklch(0.24, tint(0.024), h),
    "--muted": oklch(0.955, tint(0.018), h),
    "--muted-foreground": oklch(0.46, tint(0.024), h),
    "--accent": oklch(0.95, tint(0.05), h),
    "--accent-foreground": oklch(0.24, tint(0.03), h),
    "--border": oklch(0.9, tint(0.02), h),
    "--input": oklch(0.9, tint(0.02), h),

    "--panel": oklch(0.99, tint(0.008), h),
    "--hairline": oklch(0.2, tint(0.02), h, 12),
    "--grid": oklch(0.2, tint(0.02), h, 3),
    "--sheen": oklch(1, 0, h, 80),
    "--led-off": oklch(0.82, tint(0.02), h),
    "--led-glow": oklch(accentL, accentC, h, 35),
    "--wash": oklch(accentL, accentC, h, 9),
    "--code-bg": oklch(0.985, tint(0.012), h),
    "--code-border": oklch(0.2, tint(0.02), h, 10),

    // The sky: the band a program's wordmark sits on at the top of its docs
    // home, and the one the page runs back into at the foot. A pale tint of
    // the brand hue with its own ink, so text on it still reads.
    "--sky": oklch(0.905, tint(0.045), h),
    "--sky-deep": oklch(0.5, Math.max(tint(0.1), 0.06), h),
    "--on-sky": oklch(0.32, tint(0.05), h),
    "--sky-rule": oklch(0.32, tint(0.05), h, 16),
    "--shadow-panel": `0 1px 0 ${oklch(1, 0, h, 90)}, 0 10px 30px -20px ${oklch(0.2, tint(0.02), h, 35)}`,
  };
}

/** The program's palette as one `:root` block, inlined by the layout. */
export function themeCss(seed: ThemeSeed): string {
  const declared = Object.entries(generateTokens(seed))
    .map(([key, value]) => `${key}:${value};`)
    .join("");
  // color-scheme pins form controls and scrollbars to light too, so a reader
  // whose OS is dark doesn't get a dark scrollbar on a light page.
  return `:root{color-scheme:light;${declared}}`;
}

/**
 * Flat hex versions of the handful of colors the OG image needs. satori renders
 * with its own CSS subset and has no oklch() support, so the same seed is
 * resolved to sRGB here instead of being read from the page.
 *
 * Same lightness decisions as the page, so a share card looks like the thing it
 * links to rather than a differently-themed poster for it.
 */
export function ogColors(seed: ThemeSeed) {
  const brand = hexToOklch(seed.brand);
  const second = hexToOklch(seed.secondary);
  const tint = (cap: number) => Math.min(brand.c, cap);
  return {
    background: oklchToHex(0.975, tint(0.01), brand.h),
    panel: oklchToHex(0.995, tint(0.006), brand.h),
    foreground: oklchToHex(0.2, tint(0.024), brand.h),
    muted: oklchToHex(0.46, tint(0.024), brand.h),
    brand: oklchToHex(
      clamp(brand.l, 0.45, 0.72),
      Math.max(brand.c, 0.05),
      brand.h,
    ),
    brand2: oklchToHex(
      clamp(second.l, 0.5, 0.78),
      Math.max(second.c, 0.05),
      second.h,
    ),
    hairline: oklchToHex(0.9, tint(0.02), brand.h),
    sky: oklchToHex(0.905, tint(0.045), brand.h),
    onSky: oklchToHex(0.32, tint(0.05), brand.h),
  };
}
