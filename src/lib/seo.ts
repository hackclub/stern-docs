/**
 * Structured data and the handful of metadata values that are derived rather
 * than written. Nothing in here is prose: names, URLs and labels that already
 * exist elsewhere, arranged the way crawlers ask for them.
 */

import type { DocsConfig } from "@/lib/content";
import { AUTHOR_NAME, AUTHOR_URL, HACK_CLUB_URL, SITE_URL } from "@/lib/site";

/** `<script type="application/ld+json">` body. `<` is escaped so a title can't close the tag. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Who to name as the author: the program's own, else the site's. */
export function authorOf(config: DocsConfig): { name: string; url: string } {
  return {
    name: config.author?.name ?? AUTHOR_NAME,
    url: config.author?.href ?? AUTHOR_URL,
  };
}

/**
 * Search keywords, built from names the program already has rather than
 * invented: its name, what it is, where it runs, and what it accepts.
 */
export function keywordsFor(name: string, projectTypes: string[]): string[] {
  const base = [
    name,
    `${name} docs`,
    "Hack Club",
    "YSWS",
    "You Ship We Ship",
    "stern",
    "Hackatime",
  ];
  return Array.from(new Set([...base, ...projectTypes].filter(Boolean)));
}

const organization = {
  "@type": "Organization",
  name: "Hack Club",
  url: HACK_CLUB_URL,
  logo: `${SITE_URL}/brand/hackclub-icon.svg`,
};

export function articleJsonLd(input: {
  title: string;
  description: string | null;
  url: string;
  image: string;
  section: string | null;
  siteName: string;
  config: DocsConfig;
}) {
  const author = authorOf(input.config);
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: input.title,
    description: input.description ?? undefined,
    url: input.url,
    image: input.image,
    articleSection: input.section ?? undefined,
    inLanguage: "en",
    isAccessibleForFree: true,
    author: { "@type": "Person", name: author.name, url: author.url },
    publisher: organization,
    isPartOf: { "@type": "WebSite", name: input.siteName, url: SITE_URL },
    mainEntityOfPage: input.url,
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function websiteJsonLd(input: { name: string; url: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: input.name,
    url: input.url,
    publisher: organization,
    inLanguage: "en",
  };
}
