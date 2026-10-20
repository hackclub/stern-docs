/**
 * Client for stern's public program endpoint
 * (https://stern.hackclub.com/api/public/programs/<slug>).
 *
 * Two rules shape this file:
 *
 *  1. **The docs must render without stern.** The API is a live dependency of a
 *     static-ish docs site, so every read is defensive and every failure is a
 *     `null` program rather than a thrown error. Losing the hackathon strip is
 *     acceptable; losing the documentation is not.
 *  2. **Never trust the payload's own liveness flags.** stern computes
 *     `hasEnded` at response time and we cache the response, so the schedule is
 *     recomputed locally from `startsAt`/`endsAt` (see lib/schedule.ts).
 */

import { SITE_URL, STERN_API_BASE } from "@/lib/site";

export type ProgramImages = {
  cover: string | null;
  banner: string | null;
  background: string | null;
  logo: string | null;
};

export type Program = {
  slug: string;
  name: string;
  description: string | null;
  /** "online" | "in-person" | whatever stern adds later  displayed verbatim. */
  format: string | null;
  projectTypes: string[];
  slackChannel: string | null;
  tagline: string | null;
  startsAt: string | null;
  endsAt: string | null;
  images: ProgramImages;
  accentColor: string | null;
  hoursShipped: number | null;
  links: {
    welcome: string | null;
    home: string | null;
  };
};

const str = (value: unknown): string | null =>
  typeof value === "string" && value.trim() !== "" ? value.trim() : null;

const num = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const strArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string")
    : [];

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function parseProgram(payload: unknown, slug: string): Program | null {
  const program = asRecord(asRecord(payload).program);
  const name = str(program.name);
  if (!name) return null; // Nothing usable came back.

  const images = asRecord(program.images);
  const schedule = asRecord(program.schedule);
  const welcome = asRecord(program.welcome);
  const links = asRecord(program.links);

  return {
    slug: str(program.slug) ?? slug,
    name,
    description: str(program.description),
    format: str(program.format),
    projectTypes: strArray(program.projectTypes),
    slackChannel: str(program.slackChannel),
    tagline: str(welcome.tagline),
    startsAt: str(schedule.startsAt),
    endsAt: str(schedule.endsAt),
    images: {
      cover: str(images.cover),
      banner: str(images.banner),
      background: str(images.background),
      logo: str(images.logo),
    },
    accentColor: str(program.accentColor),
    hoursShipped: num(program.hoursShipped),
    links: {
      welcome: str(links.welcome),
      home: str(links.home),
    },
  };
}

/**
 * Fetches a program, or `null` if stern is unreachable, slow, or doesn't know
 * the slug. Revalidated rather than request-time-fresh: this data changes when
 * an admin edits the program, not per visitor.
 */
export async function fetchProgram(slug: string): Promise<Program | null> {
  const url = `${STERN_API_BASE}/api/public/programs/${encodeURIComponent(slug)}`;
  try {
    const response = await fetch(url, {
      // Say who's asking. stern sits behind Vercel's bot challenge, which has
      // no way to let an anonymous server-side fetch through; a named agent
      // is at least something an allow rule can be written against.
      headers: {
        accept: "application/json",
        "user-agent": `stern-docs/1.0 (+${SITE_URL})`,
      },
      next: { revalidate: 300, tags: [`program:${slug}`] },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    return parseProgram(await response.json(), slug);
  } catch {
    // Offline dev, stern deploying, DNS hiccup  the docs still have to render.
    return null;
  }
}

/** The join link the CTAs point at, preferring the program's own welcome page. */
export function joinUrl(program: Program | null, slug: string): string {
  return (
    program?.links.welcome ??
    `${STERN_API_BASE}/${encodeURIComponent(program?.slug ?? slug)}/welcome`
  );
}
