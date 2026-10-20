/**
 * The content layer: a folder of markdown becomes a navigable, searchable docs
 * site with no database and no CMS.
 *
 *   content/
 *     _shared/
 *       contributing.md  ← appears under every program
 *     CloudFALL/
 *       docs.json        ← per-program config: title, section order, links
 *       index.md         ← the program's docs home
 *       getting-started.md
 *       shipping/
 *         devlogs.md     ← /cloudfall/shipping/devlogs
 *
 * That shape *is* the contribution model. A person who spots a wrong port number
 * edits one markdown file on github.com and opens a pull request; nothing here
 * needs to know that happened. It also means adding a whole new program's docs
 * is `mkdir content/<slug>`  the routes, nav, theme and round status are all
 * derived from the folder name plus stern's API.
 *
 * Read from disk on the server only. Pages are ISR-cached, so this runs on
 * revalidation rather than per request.
 */

import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const CONTENT_ROOT = path.join(process.cwd(), "content");

/**
 * Pages that belong to the repo rather than to any one program  how to edit a
 * page, what the frontmatter fields mean. They're written once here and served
 * under every program, because someone who finds a wrong port number is reading
 * *a program's* docs and shouldn't have to leave them to fix it.
 *
 * The leading underscore keeps it out of `listPrograms`, so it never becomes a
 * route of its own. A program that needs its own version of a shared page wins:
 * the same path under `content/<program>/` overrides it.
 */
const SHARED_DIR = "_shared";

/** `_shared` and dotfolders hold content but aren't programs. */
const isProgramFolder = (name: string) =>
  !name.startsWith(".") && !name.startsWith("_");

/** A link in the sidebar footer, the program footer, or a credit line. */
export type ConfigLink = { label: string; href: string };

export type DocsConfig = {
  /** Display title of this docs site, e.g. "CloudFALL docs". */
  title: string;
  /** One line under the title in the sidebar. */
  tagline?: string;
  /**
   * Sections, in the order they appear. A doc's `group` matches an `id`.
   * `collapsed` folds the section in the contents rail until a reader opens
   * it or is on a page inside it; for a category of guides, not a path.
   */
  groups: { id: string; label: string; blurb?: string; collapsed?: boolean }[];
  /**
   * Colors. Omit the whole block and the program's `accentColor` from stern
   * drives the palette, with its artwork supplying the companion hue.
   *
   * - `brand`/`secondary`: exact hexes, when the derived pair isn't right.
   * - `source: "images"`: let the artwork set the brand instead of accentColor.
   * - `sourceImage`: which image the artwork colour is read from (default logo).
   */
  theme?: {
    brand?: string;
    secondary?: string;
    source?: "accent" | "images";
    sourceImage?: "logo" | "background" | "banner" | "cover";
  };
  /**
   * The program's own marks, served from public/. stern supplies a logo too,
   * but stern is a live dependency and this site must still look like the
   * program when stern can't be reached. Paths are site-relative ("/programs/…").
   *
   * - `wordmark`: the full-colour mark for the docs home and the share card.
   * - `icon`: a square mark for the header and the browser tab.
   * - `credit`: who drew them. Rendered in the footer, never omitted.
   */
  brand?: {
    wordmark?: string;
    wordmarkAlt?: string;
    icon?: string;
    credit?: ConfigLink;
  };
  /** The program's public website, if it has one beyond stern. */
  site?: string;
  /** The program's home on stern. Falls back to the API's `links.home`. */
  stern?: string;
  /** Who writes these docs. Overrides NEXT_PUBLIC_AUTHOR_* for this program. */
  author?: { name: string; href?: string };
  /** Extra links in the sidebar footer  Slack, the program site, source. */
  links?: ConfigLink[];
  /** `owner/repo` for edit links; falls back to NEXT_PUBLIC_CONTENT_REPO. */
  repo?: string;
  branch?: string;
  /** Copy for the join CTA. The CTA only ever shows while the round is open. */
  join?: { label?: string; blurb?: string };
};

/**
 * Where a page's words came from, when they weren't written here. Every page
 * is either hand-written by `author` or copied verbatim from these, and the
 * site renders them at the foot of the page so the credit ships with the text.
 */
export type DocSource = {
  /** What was taken, in the source's own words: a section title, a file. */
  label: string;
  href: string | null;
  /** Who wrote it. */
  author: string | null;
  /** How it was carried over  "verbatim", "rows reformatted as a table". */
  note: string | null;
};

export type Doc = {
  /** URL segments after the program, e.g. ["shipping", "devlogs"]. Empty = home. */
  segments: string[];
  href: string;
  title: string;
  description: string | null;
  group: string | null;
  order: number;
  hidden: boolean;
  /** Who wrote the page, when the frontmatter says. Null means the site author. */
  author: string | null;
  /** Credited sources for copied text. Empty for a page written here. */
  sources: DocSource[];
  /**
   * ISO date the page was last regenerated from its sources, set by
   * scripts/sync-guides.mjs. Null for a page a person wrote.
   */
  synced: string | null;
  /**
   * Other pages worth reading next, as hrefs. "/cloudfall/guides/jellyfin"
   * or, for a page that should work under any program, "guides/jellyfin".
   * Rendered as a Related panel with each target's own title and lede.
   */
  related: string[];
  /** Topics, lowercase: "movies", "games". Each one is a page under /tag/. */
  tags: string[];
  /** Raw markdown body, frontmatter stripped. */
  body: string;
  /** Repo-relative path, for the "Edit this page" link. */
  filePath: string;
};

export type NavGroup = {
  id: string;
  label: string;
  blurb?: string;
  collapsed?: boolean;
  docs: Doc[];
};

const DEFAULT_CONFIG: DocsConfig = { title: "Docs", groups: [] };

/** Every program that has a content folder. */
export async function listPrograms(): Promise<string[]> {
  try {
    const entries = await fs.readdir(CONTENT_ROOT, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory() && isProgramFolder(entry.name))
      .map((entry) => entry.name)
      .sort();
  } catch {
    return [];
  }
}

async function readConfig(program: string): Promise<DocsConfig> {
  try {
    const raw = await fs.readFile(
      path.join(CONTENT_ROOT, program, "docs.json"),
      "utf8",
    );
    const parsed = JSON.parse(raw) as Partial<DocsConfig>;
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      groups: Array.isArray(parsed.groups) ? parsed.groups : [],
    };
  } catch {
    // A program with markdown but no docs.json still works; it just gets one
    // unnamed section and a generic title.
    return { ...DEFAULT_CONFIG, title: `${program} docs` };
  }
}

async function walk(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(full);
      return entry.name.endsWith(".md") ? [full] : [];
    }),
  );
  return files.flat();
}

const titleize = (slug: string) =>
  slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const optionalString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() !== "" ? value.trim() : null;

const stringList = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string" && v.trim() !== "").map((v) => v.trim())
    : [];

/** "Movies", " movies ", "movies" are one tag, and one URL. */
export const normalizeTag = (tag: string) =>
  tag.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

/** A related href may be site-absolute or program-relative. */
const absoluteHref = (program: string, href: string) =>
  href.startsWith("/") ? href : `/${program}/${href.replace(/^\/+/, "")}`;

/** Where a tag's listing lives. */
export const tagHref = (program: string, tag: string) =>
  `/${program}/tag/${encodeURIComponent(normalizeTag(tag))}`;

/**
 * `sources:` is a list; anything without a `label` is dropped rather than
 * rendered as an empty credit. scripts/check-content.mjs fails the build on
 * the malformed shapes before they get this far.
 */
export function parseSources(value: unknown): DocSource[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (typeof entry !== "object" || entry === null) return [];
    const record = entry as Record<string, unknown>;
    const label = optionalString(record.label);
    if (!label) return [];
    return [
      {
        label,
        href: optionalString(record.href),
        author: optionalString(record.author),
        note: optionalString(record.note),
      },
    ];
  });
}

/**
 * `program` decides the URL, `root` decides everything else  a shared page is
 * routed under whichever program is being rendered, but its edit link has to
 * point at the one file on disk that actually exists.
 */
function parseDoc(
  program: string,
  root: string,
  absolute: string,
  raw: string,
): Doc {
  const relative = path.relative(root, absolute).split(path.sep);
  const parsed = matter(raw);
  const data = parsed.data as Record<string, unknown>;

  const file = relative[relative.length - 1].replace(/\.md$/, "");
  // index.md is the folder's own page: content/x/index.md → /x, and
  // content/x/guides/index.md → /x/guides.
  const segments =
    file === "index" ? relative.slice(0, -1) : [...relative.slice(0, -1), file];

  const fallbackTitle =
    segments.length === 0
      ? "Overview"
      : titleize(segments[segments.length - 1]);

  return {
    segments,
    href: `/${[program, ...segments].join("/")}`,
    title: typeof data.title === "string" ? data.title : fallbackTitle,
    description: typeof data.description === "string" ? data.description : null,
    group: typeof data.group === "string" ? data.group : null,
    order: typeof data.order === "number" ? data.order : 999,
    hidden: data.hidden === true,
    author: optionalString(data.author),
    related: stringList(data.related).map((href) => absoluteHref(program, href)),
    tags: Array.from(new Set(stringList(data.tags).map(normalizeTag).filter(Boolean))),
    sources: parseSources(data.sources),
    synced: optionalString(data.synced instanceof Date ? data.synced.toISOString().slice(0, 10) : data.synced),
    body: parsed.content.trim(),
    filePath: ["content", ...path.relative(CONTENT_ROOT, absolute).split(path.sep)].join(
      "/",
    ),
  };
}

export type ProgramContent = {
  program: string;
  config: DocsConfig;
  docs: Doc[];
  nav: NavGroup[];
  /** Reading order across the whole site, for prev/next. */
  flat: Doc[];
};

async function readDocs(
  program: string,
  root: string,
  files: string[],
): Promise<Doc[]> {
  return Promise.all(
    files.map(async (file) =>
      parseDoc(program, root, file, await fs.readFile(file, "utf8")),
    ),
  );
}

export async function loadProgramContent(
  program: string,
): Promise<ProgramContent | null> {
  if (!isProgramFolder(program)) return null;
  const dir = path.join(CONTENT_ROOT, program);
  // Guard against `..` in a route segment reaching the filesystem.
  if (path.relative(CONTENT_ROOT, dir) !== program) return null;

  let files: string[];
  try {
    files = await walk(dir);
  } catch {
    return null;
  }
  if (files.length === 0) return null;

  const config = await readConfig(program);
  const own = await readDocs(program, dir, files);

  // Shared pages are optional and always lose to a program's own file at the
  // same path, so a program can replace one without the folder knowing.
  const sharedRoot = path.join(CONTENT_ROOT, SHARED_DIR);
  let sharedFiles: string[] = [];
  try {
    sharedFiles = await walk(sharedRoot);
  } catch {
    sharedFiles = [];
  }
  const taken = new Set(own.map((doc) => doc.segments.join("/")));
  const shared = (await readDocs(program, sharedRoot, sharedFiles)).filter(
    (doc) => !taken.has(doc.segments.join("/")),
  );

  const docs = [...own, ...shared];

  const visible = docs.filter((doc) => !doc.hidden);
  const byOrder = (a: Doc, b: Doc) =>
    a.order - b.order || a.title.localeCompare(b.title);

  // Configured sections first, in their configured order; anything with an
  // unknown or missing group is collected at the end rather than dropped.
  const nav: NavGroup[] = config.groups
    .map((group) => ({
      ...group,
      docs: visible
        .filter((doc) => doc.group === group.id && doc.segments.length > 0)
        .sort(byOrder),
    }))
    .filter((group) => group.docs.length > 0);

  const known = new Set(config.groups.map((group) => group.id));
  const orphans = visible
    .filter(
      (doc) => doc.segments.length > 0 && (!doc.group || !known.has(doc.group)),
    )
    .sort(byOrder);
  if (orphans.length > 0) {
    nav.push({ id: "more", label: "More", docs: orphans });
  }

  const home = visible.find((doc) => doc.segments.length === 0);
  const flat = [...(home ? [home] : []), ...nav.flatMap((group) => group.docs)];

  return { program, config, docs, nav, flat };
}

/** Every tag in use, with the visible pages that carry it, most used first. */
export function tagIndex(content: ProgramContent): { tag: string; docs: Doc[] }[] {
  const byTag = new Map<string, Doc[]>();
  for (const doc of content.docs) {
    if (doc.hidden) continue;
    for (const tag of doc.tags) byTag.set(tag, [...(byTag.get(tag) ?? []), doc]);
  }
  return Array.from(byTag, ([tag, docs]) => ({ tag, docs }))
    .sort((a, b) => b.docs.length - a.docs.length || a.tag.localeCompare(b.tag));
}

/** The pages a doc points to as related, in the order it listed them. */
export function relatedDocs(content: ProgramContent, doc: Doc): Doc[] {
  return doc.related
    .map((href) => content.docs.find((candidate) => candidate.href === href))
    .filter((candidate): candidate is Doc => candidate != null && !candidate.hidden);
}

export function findDoc(
  content: ProgramContent,
  segments: string[],
): Doc | null {
  const target = segments.join("/");
  return content.docs.find((doc) => doc.segments.join("/") === target) ?? null;
}

/** Previous/next in reading order, for the bottom-of-page pager. */
export function neighbours(content: ProgramContent, doc: Doc) {
  const index = content.flat.findIndex(
    (candidate) => candidate.href === doc.href,
  );
  return {
    previous: index > 0 ? content.flat[index - 1] : null,
    next:
      index >= 0 && index < content.flat.length - 1
        ? content.flat[index + 1]
        : null,
  };
}

/**
 * GitHub's edit URL. Hitting it without write access forks the repo and opens a
 * PR, which is exactly the flow this site wants, so it's the same link for
 * maintainers and drive-by contributors.
 */
export function editUrl(
  doc: Doc,
  config: DocsConfig,
  fallbackRepo: string,
  fallbackBranch: string,
): string | null {
  const repo = config.repo || fallbackRepo;
  if (!repo) return null;
  const branch = config.branch || fallbackBranch;
  // A synced page is regenerated from upstream; an edit to its words would be
  // overwritten on the next run. The thing to edit is its recipe.
  const file = doc.synced ? "scripts/sync-guides.mjs" : doc.filePath;
  return `https://github.com/${repo}/edit/${branch}/${file}`;
}

/** The program's short name: "CloudFALL docs" → "CloudFALL". */
export function programName(config: DocsConfig): string {
  return config.title.replace(/\s+docs$/i, "").trim() || config.title;
}
