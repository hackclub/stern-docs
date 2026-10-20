#!/usr/bin/env node
/**
 * Content checks that CI runs on every pull request.
 *
 * Contributors edit markdown on github.com and can't run the build, so the
 * mistakes a text editor can't catch are caught here instead:
 *
 *   - frontmatter shape: `title` is a string, `order` a number, `hidden` a
 *     boolean, `group` names a section in that program's docs.json
 *   - credits: every `sources:` entry has a `label` and an `href`, because a
 *     credit that doesn't say where the text came from isn't one
 *   - the organisation's name is written "Hack Club" and nothing else, in
 *     content and in UI strings alike (URLs and handles are skipped)
 *
 * Usage: node scripts/check-content.mjs   (exit 1 on any failure)
 */

import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const ROOT = process.cwd();
const CONTENT = path.join(ROOT, "content");

const problems = [];
const fail = (file, line, message) =>
  problems.push(`${path.relative(ROOT, file)}${line ? `:${line}` : ""}  ${message}`);

async function walk(dir, keep) {
  const out = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full, keep)));
    else if (keep(entry.name)) out.push(full);
  }
  return out;
}

async function readGroups(programDir) {
  try {
    const raw = await fs.readFile(path.join(programDir, "docs.json"), "utf8");
    const config = JSON.parse(raw);
    return new Set((config.groups ?? []).map((group) => group.id));
  } catch {
    return null; // No docs.json: any group is an orphan, which the site allows.
  }
}

/* ── frontmatter ──────────────────────────────────────────────────────────── */

async function checkFrontmatter() {
  const programs = (await fs.readdir(CONTENT, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  // Shared pages are served under every program, so a group they name has to
  // exist in at least one program for the page to land somewhere.
  const union = new Set();
  const perProgram = new Map();
  for (const program of programs) {
    if (program.startsWith("_") || program.startsWith(".")) continue;
    const groups = await readGroups(path.join(CONTENT, program));
    perProgram.set(program, groups);
    for (const id of groups ?? []) union.add(id);
  }

  const files = await walk(CONTENT, (name) => name.endsWith(".md"));

  // Every page's href, per program, so `related:` can be checked. Shared pages
  // exist under every program.
  const hrefOf = (file) => {
    const rel = path.relative(CONTENT, file).split(path.sep);
    const program = rel[0];
    const parts = rel.slice(1);
    const last = parts[parts.length - 1].replace(/\.md$/, "");
    const segments = last === "index" ? parts.slice(0, -1) : [...parts.slice(0, -1), last];
    return { program, path: segments.join("/") };
  };
  const pages = files.map(hrefOf);
  const exists = (program, href) => {
    const target = href.startsWith("/") ? href.replace(/^\/[^/]+\/?/, "") : href.replace(/^\/+/, "");
    return pages.some((p) => (p.program === program || p.program.startsWith("_")) && p.path === target);
  };

  for (const file of files) {
    const raw = await fs.readFile(file, "utf8");
    let parsed;
    try {
      parsed = matter(raw);
    } catch (error) {
      fail(file, 1, `frontmatter does not parse: ${error.message}`);
      continue;
    }
    const data = parsed.data ?? {};
    const program = path.relative(CONTENT, file).split(path.sep)[0];
    const groups = program.startsWith("_") ? union : perProgram.get(program);

    if (data.title !== undefined && typeof data.title !== "string") {
      fail(file, 1, "`title` must be a string");
    }
    if (data.description !== undefined && typeof data.description !== "string") {
      fail(file, 1, "`description` must be a string");
    }
    if (data.order !== undefined && typeof data.order !== "number") {
      fail(file, 1, "`order` must be a number");
    }
    if (data.hidden !== undefined && typeof data.hidden !== "boolean") {
      fail(file, 1, "`hidden` must be true or false");
    }
    if (data.author !== undefined && typeof data.author !== "string") {
      fail(file, 1, "`author` must be a name");
    }
    if (data.synced !== undefined) {
      const iso = data.synced instanceof Date ? data.synced.toISOString().slice(0, 10) : data.synced;
      if (typeof iso !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
        fail(file, 1, "`synced` must be a YYYY-MM-DD date");
      }
      if (!Array.isArray(data.sources) || data.sources.length === 0) {
        fail(file, 1, "a synced page must list the `sources` it was copied from");
      }
    }
    if (
      typeof data.group === "string" &&
      groups &&
      groups.size > 0 &&
      !groups.has(data.group)
    ) {
      fail(
        file,
        1,
        `group "${data.group}" is not an id in docs.json (${[...groups].join(", ")})`,
      );
    }

    if (data.related !== undefined) {
      if (!Array.isArray(data.related)) {
        fail(file, 1, "`related` must be a list of page paths");
      } else {
        const program = path.relative(CONTENT, file).split(path.sep)[0];
        for (const href of data.related) {
          if (typeof href !== "string") { fail(file, 1, "`related` entries must be strings"); continue; }
          if (!program.startsWith("_") && !exists(program, href)) {
            fail(file, 1, `related page not found: ${href}`);
          }
        }
      }
    }
    if (data.tags !== undefined) {
      if (!Array.isArray(data.tags) || data.tags.some((t) => typeof t !== "string" || !t.trim())) {
        fail(file, 1, "`tags` must be a list of words");
      }
    }

    if (data.sources !== undefined) {
      if (!Array.isArray(data.sources)) {
        fail(file, 1, "`sources` must be a list");
      } else {
        data.sources.forEach((source, index) => {
          if (typeof source !== "object" || source === null) {
            fail(file, 1, `sources[${index}] must be a map with label and href`);
            return;
          }
          if (typeof source.label !== "string" || !source.label.trim()) {
            fail(file, 1, `sources[${index}] needs a \`label\``);
          }
          if (typeof source.href !== "string" || !/^https?:\/\//.test(source.href)) {
            fail(file, 1, `sources[${index}] needs an \`href\` starting with http`);
          }
        });
      }
    }
  }
}

/* ── the name ─────────────────────────────────────────────────────────────── */

/** Prose spellings. `HACK_CLUB` is an identifier, not prose, so no underscore. */
const NAME = /\bhack[\s-]?club(?:ber)?s?\b/gi;

/** Things that legitimately contain "hackclub": URLs, domains, handles, paths. */
const SKIP = [
  /https?:\/\/\S+/g,
  // Domains, org paths and file names: hackclub.com/slack, cdn.hackclub.com,
  // hackclub/YSWS-Catalog, hackclub-flag.svg. The lookahead keeps a sentence
  // ending in "Hackclub." in play, since a full stop isn't a domain.
  /\S*hackclub(?:[./_-](?=\w))\S*/gi,
  /[@#]\S+/g, // handles and channels
  /`[^`\n]*`/g, // inline code
];

function checkName(file, text) {
  const lines = text.split("\n");
  lines.forEach((line, index) => {
    let scrubbed = line;
    for (const pattern of SKIP) scrubbed = scrubbed.replace(pattern, " ");
    for (const match of scrubbed.matchAll(NAME)) {
      const word = match[0];
      if (word.startsWith("Hack Club")) continue;
      fail(file, index + 1, `write "Hack Club", not "${word}"`);
    }
  });
}

async function checkNames() {
  const targets = [
    ...(await walk(CONTENT, (name) => name.endsWith(".md") || name.endsWith(".json"))),
    ...(await walk(path.join(ROOT, "src"), (name) => /\.(tsx?|css)$/.test(name))),
    ...(await walk(path.join(ROOT, "public"), (name) => name.endsWith(".js"))),
    path.join(ROOT, "README.md"),
    path.join(ROOT, "AGENTS.md"),
  ];
  for (const file of targets) {
    let text;
    try {
      text = await fs.readFile(file, "utf8");
    } catch {
      continue;
    }
    checkName(file, text);
  }
}

/* ── run ──────────────────────────────────────────────────────────────────── */

await checkFrontmatter();
await checkNames();

if (problems.length > 0) {
  console.error(`check-content: ${problems.length} problem(s)\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}
console.log("check-content: ok");
