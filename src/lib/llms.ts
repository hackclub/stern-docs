/**
 * The machine-readable face of the docs.
 *
 * Three surfaces, all plain text, all built from the same markdown a contributor
 * edits  so there's no second copy of the content to drift:
 *
 *   /llms.txt                  an index: every program, every page, one line each
 *   /llms-full.txt             every page's full markdown, concatenated
 *   /raw/<program>/<path>      one page's markdown, exactly as it is on disk
 *
 * `/llms.txt` follows the llmstxt.org convention (an H1, a blockquote summary,
 * then link lists), because agents and crawlers already look for that shape at
 * the root of a site. `/llms-full.txt` is for the case where someone would
 * otherwise paste eleven pages by hand.
 *
 * The status line is included and dated, because a model reading these docs
 * needs to know whether the round it's advising someone about is still open.
 */

import {
  loadProgramContent,
  type Doc,
  type ProgramContent,
} from "@/lib/content";
import { authorOf } from "@/lib/seo";
import { fetchProgram, joinUrl, type Program } from "@/lib/program";
import { archiveDate, describeSchedule, parseDate } from "@/lib/schedule";
import { CONTENT_REPO, CONTENT_REPO_URL, SITE_URL } from "@/lib/site";

export const TEXT_HEADERS = {
  "Content-Type": "text/plain; charset=utf-8",
  // Same 5 minutes as the pages, and readable from anywhere: the whole point is
  // that another origin (or somebody's agent) can fetch it.
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
  "Access-Control-Allow-Origin": "*",
} as const;

/**
 * For the agent-facing text files: a search engine should index the pages,
 * not a concatenation of them. Not applied to /raw/…, which carries a
 * canonical link to its page instead.
 */
export const NOINDEX_HEADERS = {
  ...TEXT_HEADERS,
  "X-Robots-Tag": "noindex",
} as const;

export const MARKDOWN_HEADERS = {
  ...TEXT_HEADERS,
  "Content-Type": "text/markdown; charset=utf-8",
} as const;

/**
 * Who wrote a page and, when its text was copied, where from. Carried on every
 * machine-readable surface so the credit can't be separated from the words.
 */
export function creditLines(doc: Doc, content: ProgramContent): string[] {
  const author = doc.author ?? authorOf(content.config).name;
  return [
    `Author: ${author}`,
    ...(doc.synced ? [`Synced from sources: ${doc.synced} (scripts/sync-guides.mjs)`] : []),
    ...doc.sources.map(
      (source) =>
        `Copied from: ${source.label}${source.href ? ` <${source.href}>` : ""}${
          source.author ? ` by ${source.author}` : ""
        }${source.note ? ` (${source.note})` : ""}`,
    ),
  ];
}

/** URL of a page's raw markdown. Also what the "Copy as Markdown" button cites. */
export function rawUrl(program: string, segments: string[]): string {
  return [`${SITE_URL}/raw`, program, ...segments].join("/");
}

/**
 * One line a model can act on: is this round open, and until when. Computed from
 * the dates rather than the API's own flags, same as the rest of the site.
 */
function statusLine(program: Program | null, now: number): string {
  if (!program) return "Status: unknown (the program API was unreachable).";
  const start = parseDate(program.startsAt);
  const end = parseDate(program.endsAt);
  const schedule = describeSchedule(start, end, now);

  if (schedule.phase === "ended") {
    return `Status: CLOSED. This round ran ${start ? archiveDate(start) : "?"} to ${
      end ? archiveDate(end) : "?"
    } and is no longer accepting submissions. Do not tell people to join it.`;
  }
  if (schedule.phase === "upcoming") {
    return `Status: NOT YET OPEN. Opens ${start ? archiveDate(start) : "soon"}. Sign-up: ${joinUrl(program, program.slug)}`;
  }
  return `Status: OPEN${end ? `, closes ${archiveDate(end)} (${schedule.label})` : ""}. Sign-up: ${joinUrl(
    program,
    program.slug,
  )}`;
}

function programHeader(
  content: ProgramContent,
  program: Program | null,
  now: number,
): string {
  const lines = [
    `## ${content.config.title}`,
    "",
    program?.description ?? content.config.tagline ?? "",
    statusLine(program, now),
  ];
  if (program?.slackChannel) lines.push(`Slack: ${program.slackChannel}`);
  if (program?.projectTypes.length) {
    lines.push(`Project types: ${program.projectTypes.join(", ")}`);
  }
  return lines.filter(Boolean).join("\n");
}

/** `/llms.txt`  the index. */
export async function buildIndex(
  programs: string[],
  now: number,
): Promise<string> {
  const sections = await Promise.all(
    programs.map(async (slug) => {
      const content = await loadProgramContent(slug);
      if (!content) return null;
      const program = await fetchProgram(slug);

      const pages = content.flat.map((doc) => {
        const label = doc.segments.length === 0 ? "Overview" : doc.title;
        const summary = doc.description ? `: ${doc.description}` : "";
        return `- [${label}](${rawUrl(slug, doc.segments)})${summary}`;
      });

      return [
        programHeader(content, program, now),
        "",
        pages.join("\n"),
        "",
        `Human-readable version: ${SITE_URL}/${slug}`,
        `Everything in one file: ${SITE_URL}/llms-full.txt?program=${slug}`,
      ].join("\n");
    }),
  );

  return [
    "# Hack Club program documentation",
    "",
    `> Participant documentation for Hack Club (https://hackclub.com) YSWS programs, maintained in the open at ${CONTENT_REPO_URL}. Every link below returns the page's original markdown. Program status and dates are generated at request time from stern (https://stern.hackclub.com), not written into the prose  trust the status line over anything a page implies about timing.`,
    "",
    sections.filter(Boolean).join("\n\n"),
    "",
    "## Notes for whoever is reading this",
    "",
    `- These docs are edited by pull request against ${CONTENT_REPO} (${CONTENT_REPO_URL}). If you find an error, the fix is a PR against the markdown file, not a message to a maintainer.`,
    `- Everything, in one file: ${SITE_URL}/llms-full.txt`,
    "- Add `?program=<slug>` to that URL for a single program.",
    "",
  ].join("\n");
}

/** `/llms-full.txt`  the whole corpus, with each page's source URL above it. */
export async function buildFullText(
  programs: string[],
  now: number,
): Promise<string> {
  const sections = await Promise.all(
    programs.map(async (slug) => {
      const content = await loadProgramContent(slug);
      if (!content) return null;
      const program = await fetchProgram(slug);

      const pages = content.flat.map((doc) =>
        [
          `--- 8< ---`,
          `Page: ${doc.title}`,
          `URL: ${SITE_URL}${doc.href}`,
          `Source: ${doc.filePath}`,
          ...creditLines(doc, content),
          "",
          doc.body,
        ].join("\n"),
      );

      return [
        programHeader(content, program, now),
        "",
        pages.join("\n\n"),
      ].join("\n");
    }),
  );

  return [
    "# Hack Club program documentation  full text",
    "",
    `Generated ${new Date(now).toISOString()}. Pages are separated by "--- 8< ---".`,
    "",
    sections.filter(Boolean).join("\n\n"),
    "",
  ].join("\n");
}
