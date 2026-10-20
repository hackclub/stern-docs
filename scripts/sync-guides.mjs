#!/usr/bin/env node
/**
 * Regenerates content/cloudfall/guides/ from its upstream sources.
 *
 * Every guide page is copied text. This script is the only thing that writes
 * those files: it fetches each source at its current revision, slices the
 * sections the page's recipe names, converts markup only (admonitions to
 * callouts, relative links to absolute, images and site components dropped,
 * headings nested), and writes the page with a `sources:` block naming the
 * revision it copied. Nobody edits the words by hand, which is what the
 * CC BY-ND source requires and what every other source deserves.
 *
 *   pnpm sync:guides            rewrite pages whose upstream text changed
 *   pnpm sync:guides --check    exit 1 if any page is stale, write nothing
 *
 * .github/workflows/sync-guides.yml runs it weekly and opens a pull request
 * with the diff, so a person sees exactly what upstream changed before it
 * ships. A recipe that can't find its section fails the run rather than
 * writing a shorter page.
 */

import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "content", "cloudfall", "guides");
const CHECK = process.argv.includes("--check");
const TODAY = new Date().toISOString().slice(0, 10);
const UA = "stern-docs sync-guides (https://github.com/AD-Archer/stern-docs)";

/* ── fetching ─────────────────────────────────────────────────────────────── */

const cache = new Map();

async function get(url, init = {}) {
  if (cache.has(url)) return cache.get(url);
  const promise = (async () => {
    for (let attempt = 1; attempt <= 3; attempt++) {
      const res = await fetch(url, {
        ...init,
        headers: { "user-agent": UA, ...(init.headers ?? {}) },
      });
      // Some upstream files are CRLF; the recipes slice on "\n".
      if (res.ok) return (await res.text()).replaceAll("\r\n", "\n");
      if (attempt === 3) throw new Error(`${url}: HTTP ${res.status}`);
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  })();
  cache.set(url, promise);
  return promise;
}

const ghHeaders = () =>
  process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {};

/** Head commit of a branch, for the permalink in the credit. */
const heads = new Map();
async function headSha(repo, branch) {
  const key = `${repo}@${branch}`;
  if (!heads.has(key)) {
    heads.set(
      key,
      get(`https://api.github.com/repos/${repo}/branches/${branch}`, { headers: ghHeaders() })
        .then((t) => JSON.parse(t).commit.sha)
        .catch(() => null),
    );
  }
  return heads.get(key);
}

const raw = (repo, branch, file) =>
  get(`https://raw.githubusercontent.com/${repo}/${branch}/${file}`);

/** Plain-text extract plus the revision it came from. */
async function wiki(title) {
  const url =
    "https://en.wikipedia.org/w/api.php?action=query&prop=extracts|revisions&explaintext=1" +
    "&exsectionformat=wiki&rvprop=ids|timestamp&format=json&redirects=1&titles=" +
    encodeURIComponent(title);
  const data = JSON.parse(await get(url));
  const page = Object.values(data.query.pages)[0];
  if (!page || page.missing !== undefined || !page.extract) {
    throw new Error(`Wikipedia: no article for ${title}`);
  }
  const rev = page.revisions?.[0];
  return {
    text: page.extract,
    title: page.title,
    revid: rev?.revid ?? null,
    date: rev?.timestamp?.slice(0, 10) ?? null,
  };
}

/* ── slicing: wikipedia ───────────────────────────────────────────────────── */

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function wikiLead(text, paras) {
  const lead = text.split("\n== ")[0].trim();
  let ps = lead.split("\n").filter((p) => p.trim());
  if (paras) ps = ps.slice(0, paras);
  return ps.join("\n\n");
}

function wikiSection(text, name, { paras, level = 2 } = {}) {
  const marker = "=".repeat(level);
  const start = new RegExp(`^${esc(marker)} ${esc(name)} ${esc(marker)}\\s*$`, "m");
  const m = start.exec(text);
  if (!m) throw new Error(`wiki section not found: ${name}`);
  const rest = text.slice(m.index + m[0].length);
  const end = /^={2,} [^=\n]+ ={2,}\s*$/m.exec(rest);
  const body = end ? rest.slice(0, end.index) : rest;
  let ps = body.split("\n").filter((p) => p.trim());
  if (paras) ps = ps.slice(0, paras);
  return ps.join("\n\n");
}

function wikiFirstSentence(text) {
  const lead = wikiLead(text, 1);
  const m = /(.+?\.)(\s|$)/.exec(lead);
  return m ? m[1] : lead;
}

/* ── slicing: markdown ────────────────────────────────────────────────────── */

function stripFrontmatter(text) {
  if (!text.startsWith("---")) return text;
  const end = text.indexOf("\n---", 3);
  return end === -1 ? text : text.slice(end + 4);
}

function mdSection(text, heading, { includeHeading = false, until } = {}) {
  const lines = text.split("\n");
  const i = lines.findIndex((l) => l.trim() === heading.trim());
  if (i === -1) throw new Error(`md section not found: ${heading}`);
  const level = heading.length - heading.replace(/^#+/, "").length;
  const out = includeHeading ? [lines[i]] : [];
  const stop = new RegExp(`^#{1,${level}} `);
  for (const l of lines.slice(i + 1)) {
    if (until && l.trim() === until.trim()) break;
    if (stop.test(l)) break;
    out.push(l);
  }
  return out.join("\n").replace(/^\n+|\n+$/g, "");
}

function between(text, start, end) {
  const i = text.indexOf(start);
  if (i === -1) throw new Error(`marker not found: ${start.slice(0, 40)}`);
  const from = i + start.length;
  const j = end ? text.indexOf(end, from) : text.length;
  if (j === -1) throw new Error(`end marker not found: ${end.slice(0, 40)}`);
  return text.slice(from, j).replace(/^\n+|\n+$/g, "");
}

const ALERT = {
  note: "NOTE", info: "NOTE", tip: "TIP", success: "TIP", important: "IMPORTANT",
  warning: "WARNING", bug: "WARNING", caution: "CAUTION", danger: "CAUTION", quickstart: "NOTE",
};

function quote(body, kind, title) {
  body = body.replace(/^\n+|\n+$/g, "");
  const lines = [`> [!${ALERT[kind.toLowerCase()] ?? "NOTE"}]`];
  if (title) lines.push(`> **${title}**`);
  for (const l of body.split("\n")) lines.push(("> " + l).trimEnd());
  while (lines.length > 1 && lines[lines.length - 1] === ">") lines.pop();
  return lines.join("\n") + "\n";
}

function docusaurusAdmonitions(text) {
  return text.replace(
    /^:::(\w+)(?:\[([^\]]*)\]|[ \t]+([^\n]+?))?[ \t]*\n(.*?)^:::[ \t]*$/gms,
    (_, kind, bracket, spaced, body) => quote(body, kind, bracket || spaced),
  );
}

function mkdocsAdmonitions(text) {
  const lines = text.split("\n");
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const m = /^(!!!|\?\?\?\+?)\s+(\w+)(?:\s+"(.*)")?\s*$/.exec(lines[i]);
    if (!m) { out.push(lines[i]); i += 1; continue; }
    const kind = m[2];
    let title = m[3];
    const body = [];
    i += 1;
    while (i < lines.length && (lines[i].startsWith("    ") || lines[i].trim() === "")) {
      body.push(lines[i].startsWith("    ") ? lines[i].slice(4) : "");
      i += 1;
    }
    let inner = mkdocsAdmonitions(body.join("\n"));
    if (title) {
      title = title.replace(/\s*-\s*\[Click to show\/hide\]\s*$/, "").replaceAll("**", "").replaceAll("<br>", "\n");
      title = title.replace(/<[^>]+>/g, "").replaceAll(":bangbang:", "").trim();
      if (title.includes("\n")) {
        inner = (title + "\n\n" + inner).replace(/^\n+|\n+$/g, "");
        title = undefined;
      }
    }
    out.push(quote(inner, kind, title || undefined));
  }
  return out.join("\n");
}

function hugoCleanup(text) {
  text = text.replace(/^\{\{<\s*accordion title="([^"]+)"\s*>\}\}\s*$/gm, "### $1");
  text = text.replace(/^\{\{<[^\n]*>\}\}\s*$/gm, "");
  text = text.replace(/\{\{<[^\n]*?>\}\}/g, "");
  text = text.replace(
    /^\{\{%\s*alert[^%]*title="([^"]+)"[^%]*%\}\}\s*\n(.*?)\{\{%\s*\/alert\s*%\}\}/gms,
    (_, title, body) => quote(body, "note", title.trim().toLowerCase() === "note" ? undefined : title),
  );
  return text;
}

function commonCleanup(text) {
  text = text.replace(/<!--.*?-->/gs, "");
  text = text.replace(/^import .*$/gm, "");
  text = text.replace(/^<[A-Z][A-Za-z]*[^>]*\/>\s*$/gm, "");
  text = text.replace(/^<\/?(Tabs|TabItem)[^>]*>\s*$/gm, "");
  text = text.replace(/^!\[[^\]]*\]\([^)]*\)[^\n]*$/gm, "");
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, "");
  text = text.replace(/<img[^>]*>/g, "");
  text = text.replace(/^\s*<p align="center">.*?<\/p>\s*$/gms, "");
  text = text.replace(/\{:target="_blank"[^}]*\}/g, "");
  text = text.replace(/^--8<--.*$/gm, "");
  text = text.replace(/^\[Back to the Top\]\([^)]*\)\s*$/gm, "");
  text = text.replace(/\[([^\]]+)\]\(abbr:[^)]*\)/g, "$1");
  text = text.replace(/\n{3,}/g, "\n\n");
  return text.replace(/^\n+|\n+$/g, "");
}

function absolutize(text, base, { mdToDir = false, stripExt = [] } = {}) {
  return text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (whole, label, href) => {
    if (/^(https?:\/\/|mailto:|#|\/cloudfall\/)/.test(href)) return whole;
    let h = href.replace(/_?index\.mdx?(?=#|$)/, "");
    for (const ext of stripExt) h = h.replace(new RegExp(`\\.${ext}(?=#|$)`), mdToDir ? "/" : "");
    if (h.startsWith("./")) h = h.slice(2);
    while (h.startsWith("../")) h = h.slice(3);
    if (h.startsWith("/")) h = h.slice(1);
    return `[${label}](${base.replace(/\/+$/, "")}/${h})`;
  });
}

const demote = (text, n = 1) =>
  text.replace(/^(#{1,5}) /gm, (_, hashes) => "#".repeat(hashes.length + n) + " ");

function rst(text) {
  const lines = text.split("\n");
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    let l = lines[i];
    if (i + 1 < lines.length && /^-{3,}\s*$/.test(lines[i + 1]) && l.trim()) {
      out.push("### " + l.trim().replace(/:$/, ""));
      i += 1;
      continue;
    }
    l = l.replace(/^#\.\s/, "1. ").replace(/``([^`]+)``/g, "`$1`");
    out.push(l);
  }
  return out.join("\n");
}

const paragraphs = (s) => s.split("\n\n");

/* ── credits ──────────────────────────────────────────────────────────────── */

const WIKI = (w, note = "Sections copied verbatim; wiki markup converted to Markdown.") => ({
  label: `Wikipedia, "${w.title}"`,
  href: w.revid
    ? `https://en.wikipedia.org/w/index.php?title=${encodeURIComponent(w.title.replaceAll(" ", "_"))}&oldid=${w.revid}`
    : `https://en.wikipedia.org/wiki/${encodeURIComponent(w.title.replaceAll(" ", "_"))}`,
  author: "Wikipedia contributors, CC BY-SA 4.0",
  note: `${note}${w.date ? ` Revision of ${w.date}.` : ""}`,
});

/** A credit for a file in a GitHub repo, with the commit it was read at. */
async function repoSource({ label, href, author, note, repo, branch }) {
  const sha = await headSha(repo, branch);
  return { label, href, author, note: `${note}${sha ? ` Upstream commit ${sha.slice(0, 7)}.` : ""}` };
}

/* ── recipes ──────────────────────────────────────────────────────────────── */

const DOCKER = (title, docPath) => ({
  label: `Docker Docs, "${title}"`, href: `https://docs.docker.com/${docPath}/`,
  author: "Docker, Inc. and contributors, Apache-2.0",
  note: "Copied verbatim from the docker/docs repository; screenshots, video embeds and the Docker Desktop tab removed, links made absolute.",
  repo: "docker/docs", branch: "main",
});
const DB = "https://docs.docker.com";
const JF = "https://jellyfin.org";
const JFSRC = (title, docPath) => ({
  label: `Jellyfin documentation, "${title}"`, href: `${JF}/docs/general/${docPath}`,
  author: "Jellyfin contributors, CC BY-ND 4.0",
  note: "Sections copied whole and unchanged, as the licence requires; only relative links were made absolute, site components removed and headings nested.",
  repo: "jellyfin/jellyfin.org", branch: "master",
});
const HB = "https://handbrake.fr/docs/en/latest";
const HBSRC = (title, docPath) => ({
  label: `HandBrake Documentation, "${title}"`, href: `${HB}/${docPath}.html`,
  author: "HandBrake Team, CC BY-SA 4.0",
  note: "Copied verbatim; screenshots and platform markers removed, links made absolute.",
  repo: "HandBrake/HandBrake-docs", branch: "master",
});
const PM = "https://docs.papermc.io";
const PMSRC = (title, docPath) => ({
  label: `PaperMC Documentation, "${title}"`, href: `${PM}/paper/${docPath}`,
  author: "PaperMC and contributors, BSD-2-Clause",
  note: "Copied verbatim; links made absolute, screenshots removed.",
  repo: "PaperMC/docs", branch: "main",
});
const IM = "https://docs.immich.app";
const IMSRC = (title, docPath) => ({
  label: `Immich documentation, "${title}"`, href: `${IM}/${docPath}`,
  author: "Immich contributors, AGPL-3.0",
  note: "Copied verbatim from the immich-app/immich repository docs; site components replaced with their text, links made absolute.",
  repo: "immich-app/immich", branch: "main",
});
const NV = "https://www.navidrome.org";
const TA = "https://docs.tubearchivist.com";
const PH = "https://docs.pi-hole.net";
const TR = "https://trash-guides.info";

const JFD = "docs/general";
const HBD = "source/docs/en/latest";
const PMD = "src/content/docs/paper/admin";

export const recipes = [
  {
    file: "self-hosting.md", title: "Self-hosting", group: "learn", order: 1,
    tags: ["basics", "server"], related: ["self-hosting-basics", "guides/what-is-a-container", "guides/how-compose-works"],
    async build() {
      const sh = await wiki("Self-hosting (network)");
      const hs = await wiki("Home server");
      const mr = (await raw("mikeroyal/Self-Hosting-Guide", "main", "README.md")).split("\n");
      // The two paragraphs under "# Getting Started with Self-Hosting".
      const start = mr.findIndex((l) => l.trim() === "# Getting Started with Self-Hosting");
      if (start === -1) throw new Error("Self-Hosting Guide: intro heading not found");
      const intro = mr.slice(start + 1).filter((l) => l.trim() && !l.startsWith("[Back to the Top]")).slice(0, 2);
      const media = paragraphs(wikiSection(hs.text, "Media serving", { level: 3 }));
      return {
        description: wikiFirstSentence(sh.text),
        sources: [
          WIKI(sh), WIKI(hs, "Lead and the Media serving and BitTorrent sections copied verbatim."),
          await repoSource({
            label: 'Self-Hosting Guide, "Getting Started with Self-Hosting"',
            href: "https://github.com/mikeroyal/Self-Hosting-Guide#getting-started-with-self-hosting",
            author: "Mike Royal, CC BY 4.0", note: "The two opening paragraphs copied verbatim from README.md.",
            repo: "mikeroyal/Self-Hosting-Guide", branch: "main",
          }),
        ],
        body: [
          wikiLead(sh.text),
          "## Getting Started with Self-Hosting", intro.map(commonCleanup).join("\n\n"),
          "## Benefits", wikiSection(sh.text, "Benefits"),
          "## Downsides", wikiSection(sh.text, "Downsides"),
          "## Home server", wikiLead(hs.text),
          "### Media serving", [media[0], media[5]].join("\n\n"),
          "### BitTorrent", wikiSection(hs.text, "BitTorrent", { level: 3 }),
          "## Further reading",
          "- [Self-Hosting Guide](https://github.com/mikeroyal/Self-Hosting-Guide)\n- [awesome-selfhosted](https://github.com/awesome-selfhosted/awesome-selfhosted)\n- [selfh.st](https://selfh.st/)\n- [r/selfhosted](https://www.reddit.com/r/selfhosted/)",
        ].join("\n\n"),
      };
    },
  },
  {
    file: "what-is-a-container.md", title: "What is a container?", group: "learn", order: 2,
    tags: ["docker", "basics"], related: ["guides/how-compose-works", "guides/persisting-container-data", "self-hosting-basics"],
    description: "What is a container? This concept page will teach you about containers and provide a quick hands-on where you will run your first container.",
    async build() {
      const c = stripFrontmatter(await raw("docker/docs", "main", "content/get-started/docker-concepts/the-basics/what-is-a-container.md"));
      const body = mdSection(c, "## Explanation") + "\n\n## Try it out\n\n" + between(c, '{{< tab name="Using the CLI" >}}', "{{< /tab >}}");
      return {
        sources: [await repoSource(DOCKER("What is a container?", "get-started/docker-concepts/the-basics/what-is-a-container"))],
        body: commonCleanup(hugoCleanup(absolutize(body, DB, { stripExt: ["md"] }))),
      };
    },
  },
  {
    file: "how-compose-works.md", title: "How Compose works", group: "learn", order: 3,
    tags: ["docker", "basics"], related: ["guides/what-is-a-container", "guides/persisting-container-data", "packaging"],
    description: "Learn how Docker Compose works, from the application model to Compose files and CLI, whilst following a detailed example.",
    async build() {
      const c = stripFrontmatter(await raw("docker/docs", "main", "content/manuals/compose/intro/compose-application-model.md"));
      const intro = c.split("{{< accordion")[0].trim();
      const model = paragraphs(between(c, '{{< accordion title="The Compose application model" >}}', "{{< /accordion >}}").trim()).slice(0, 3).join("\n\n");
      const composeFile = paragraphs(mdSection(c, "## The Compose file"))[0];
      const cli = mdSection(c, "## CLI", { includeHeading: true }).split("For a full list")[0];
      const body = [intro, "## The Compose application model", model, "## The Compose file", composeFile, cli].join("\n\n");
      return {
        sources: [await repoSource(DOCKER("How Compose works", "compose/intro/compose-application-model"))],
        body: commonCleanup(hugoCleanup(absolutize(body, DB, { mdToDir: true, stripExt: ["md"] }))),
      };
    },
  },
  {
    file: "persisting-container-data.md", title: "Persisting container data", group: "learn", order: 4,
    tags: ["docker", "backups"], related: ["guides/how-compose-works", "guides/hardlinks"],
    description: "This concept page will teach you the significance of data persistence in Docker",
    async build() {
      const c = stripFrontmatter(await raw("docker/docs", "main", "content/get-started/docker-concepts/running-containers/persisting-container-data.md"));
      return {
        sources: [await repoSource(DOCKER("Persisting container data", "get-started/docker-concepts/running-containers/persisting-container-data"))],
        body: commonCleanup(hugoCleanup(absolutize(mdSection(c, "## Explanation"), DB, { stripExt: ["md"] }))),
      };
    },
  },
  {
    file: "jellyfin.md", title: "Jellyfin", group: "watch", order: 1,
    tags: ["movies", "tv", "media-server"], related: ["guides/ripping-dvds", "guides/hardlinks", "guides/navidrome", "pick-a-project"],
    async build() {
      const jw = await wiki("Jellyfin");
      const R = "jellyfin/jellyfin.org", B = "master";
      const qs = stripFrontmatter(await raw(R, B, `${JFD}/quick-start.md`));
      const cont = stripFrontmatter(await raw(R, B, `${JFD}/installation/container.md`));
      const warn = /:::warning\n(.*?):::/s.exec(cont)?.[1];
      if (!warn) throw new Error("Jellyfin container page: warning block not found");
      const compose = await raw(R, B, `${JFD}/installation/_container-docker-compose.md`);
      const mv = stripFrontmatter(await raw(R, B, `${JFD}/server/media/movies.md`));
      const sh = stripFrontmatter(await raw(R, B, `${JFD}/server/media/shows.md`));
      const body = [
        wikiLead(jw.text),
        "## Quick Start", demote(qs.trim()),
        "## Container", "### Installation Instructions", quote(warn, "warning"), compose.trim(),
        "## Movies", 'Movies can be added to a Jellyfin server using the "Movies" library type.',
        "### Organization", mdSection(mv, "## Organization", { until: "### Naming" }),
        "### Naming", mdSection(mv, "### Naming"),
        "## TV Shows", 'TV Shows can be added to Jellyfin using the "Shows" library type.',
        "### Organization", mdSection(sh, "## Organization", { until: "### Naming" }),
        "### Naming", mdSection(sh, "### Naming"),
      ].join("\n\n");
      return {
        description: wikiFirstSentence(jw.text),
        sources: [
          WIKI(jw, "Lead copied verbatim."),
          await repoSource(JFSRC("Quick Start", "quick-start")),
          await repoSource(JFSRC("Container", "installation/container")),
          await repoSource(JFSRC("Movies", "server/media/movies")),
          await repoSource(JFSRC("TV Shows", "server/media/shows")),
        ],
        body: commonCleanup(docusaurusAdmonitions(absolutize(body, JF))),
      };
    },
  },
  {
    file: "ripping-dvds.md", title: "DVD and Blu-ray ripping", group: "watch", order: 2,
    tags: ["movies", "dvd", "blu-ray"], related: ["guides/jellyfin", "guides/bittorrent"],
    async build() {
      const rp = await wiki("Ripping");
      const css = await wiki("Content Scramble System");
      const R = "HandBrake/HandBrake-docs", B = "master";
      const about = stripFrontmatter(await raw(R, B, `${HBD}/introduction/about.markdown`));
      const fmt = stripFrontmatter(await raw(R, B, `${HBD}/technical/source-formats.markdown`));
      const hq = stripFrontmatter(await raw(R, B, `${HBD}/introduction/quick-start.markdown`));
      const discHeading = "## DVD, Blu-ray, AVCHD/AVCHD Lite[^avchd-partial-support], and HD-DVD[^hddvd-partial-support] discs or disc backups";
      const footnotes = (t) => t.split("\n").filter((l) => l.startsWith("[^")).join("\n");
      let steps = "### Open your existing video\n\n" + between(hq, "## Open your existing video", "## Next steps");
      steps = steps.replace(/^## /gm, "### ");
      let body = [
        wikiLead(rp.text, 3),
        "## DVD and Blu-ray ripping", wikiSection(rp.text, "DVD and Blu-ray ripping"),
        "### Circumvention of DVD copy protection", wikiSection(rp.text, "Circumvention of DVD copy protection", { level: 3 }),
        "## Content Scramble System", wikiLead(css.text, 2),
        "## Legality", wikiSection(rp.text, "Legality", { paras: 1 }),
        "### United States", wikiSection(rp.text, "United States", { level: 4 }),
        "### Canada", wikiSection(rp.text, "Canada", { level: 4 }),
        "### Europe", wikiSection(rp.text, "Europe", { level: 3, paras: 2 }),
        "### Australia and New Zealand", wikiSection(rp.text, "Australia and New Zealand", { level: 4 }),
        "## About HandBrake", "### What HandBrake does not do", mdSection(about, "## What HandBrake does not do"), footnotes(about),
        "## Supported source formats", discHeading.replace(/^## /, "### "), mdSection(fmt, discHeading), footnotes(fmt),
        "## Quick start", steps,
        "Once the file exists, name it the way the media server expects: see [Movies](/cloudfall/guides/jellyfin#movies) and [TV Shows](/cloudfall/guides/jellyfin#tv-shows).",
      ].join("\n\n");
      body = absolutize(body, HB, { stripExt: ["markdown"] });
      body = body.replace(/\((https:\/\/handbrake\.fr\/docs\/en\/latest\/[^)#]+?)(#[^)]*)?\)/g,
        (_, u, a) => `(${u.replace(/\/$/, "")}${u.endsWith(".html") ? "" : ".html"}${a ?? ""})`);
      return {
        description: wikiFirstSentence(rp.text),
        sources: [
          WIKI(rp, "Lead, the DVD and Blu-ray ripping section and parts of the Legality section copied verbatim."),
          WIKI(css, "Lead copied verbatim."),
          await repoSource(HBSRC("About HandBrake", "introduction/about")),
          await repoSource(HBSRC("Supported source formats", "technical/source-formats")),
          await repoSource(HBSRC("Quick start", "introduction/quick-start")),
        ],
        body: commonCleanup(body),
      };
    },
  },
  {
    file: "bittorrent.md", title: "BitTorrent", group: "learn", order: 5,
    tags: ["torrents", "downloads"], related: ["guides/hardlinks", "guides/jellyfin"],
    async build() {
      const bt = await wiki("BitTorrent");
      const seed = await wiki("Seeding (computing)");
      const tf = await wiki("Torrent file");
      const li = await wiki("Legal issues with BitTorrent");
      const bep = await raw("bittorrent/bittorrent.org", "master", "beps/bep_0003.rst");
      // From the end of the header block to the first section after the overview.
      const overview = rst(between(bep, "added resources for new implementors\n", "bencoding\n").trim());
      const anon = paragraphs(wikiSection(bt.text, "Anonymity", { level: 3 }));
      return {
        description: wikiFirstSentence(bt.text),
        sources: [
          WIKI(bt, "Lead and parts of the Design, Creating and publishing, Anonymity, Legislation and Security sections copied verbatim."),
          WIKI(seed, "Lead copied verbatim."), WIKI(tf, "Lead copied verbatim."),
          WIKI(li, "First paragraph copied verbatim."),
          await repoSource({
            label: "BEP 3: The BitTorrent Protocol Specification", href: "https://www.bittorrent.org/beps/bep_0003.html",
            author: "Bram Cohen; placed in the public domain",
            note: "Opening section copied verbatim; reStructuredText converted to Markdown.",
            repo: "bittorrent/bittorrent.org", branch: "master",
          }),
        ],
        body: [
          wikiLead(bt.text),
          "## Design", wikiSection(bt.text, "Design", { paras: 9 }),
          "### Downloading and sharing", wikiSection(bt.text, "Downloading and sharing", { level: 3, paras: 1 }),
          "## Creating and publishing", wikiSection(bt.text, "Creating and publishing", { paras: 1 }),
          "### Magnet links", wikiSection(bt.text, "Magnet links", { level: 3 }),
          "### Publishing a torrent", wikiSection(bt.text, "Publishing a torrent", { level: 3 }),
          "## Seeding", wikiLead(seed.text),
          "## Torrent file", wikiLead(tf.text, 2),
          "## Anonymity", [anon[0], anon[anon.length - 1]].join("\n\n"),
          "## Legislation", wikiSection(bt.text, "Legislation", { paras: 2 }),
          "## Security", paragraphs(wikiSection(bt.text, "Security"))[1],
          "## Legal issues with BitTorrent", wikiLead(li.text, 1),
          "## The BitTorrent Protocol Specification", overview,
        ].join("\n\n"),
      };
    },
  },
  {
    file: "hardlinks.md", title: "Hardlinks and Instant Moves (Atomic-Moves)", group: "learn", order: 6,
    tags: ["torrents", "storage"], related: ["guides/bittorrent", "guides/jellyfin", "guides/persisting-container-data"],
    description: "If you’re wondering why hardlinks aren’t working or why a simple move is taking far longer than it should.",
    async build() {
      const hl = await raw("TRaSH-Guides/Guides", "master", "docs/File-and-Folder-Structure/Hardlinks-and-Instant-Moves.md");
      return {
        sources: [await repoSource({
          label: 'TRaSH Guides, "Hardlinks and Instant Moves (Atomic-Moves)"', href: `${TR}/File-and-Folder-Structure/Hardlinks-and-Instant-Moves/`,
          author: "TRaSH-Guides contributors, MIT", note: "Copied verbatim; collapsible boxes rendered as callouts, links made absolute.",
          repo: "TRaSH-Guides/Guides", branch: "master",
        })],
        body: commonCleanup(mkdocsAdmonitions(absolutize(hl.replace("# Hardlinks and Instant Moves (Atomic-Moves)\n", ""), TR))),
      };
    },
  },
  {
    file: "minecraft-server.md", title: "Minecraft server", group: "else", order: 1,
    tags: ["games", "minecraft"], related: ["guides/what-is-a-container", "guides/how-compose-works", "what-you-pay-for"],
    async build() {
      const mc = await wiki("Minecraft server");
      const R = "PaperMC/docs", B = "main";
      const gs = stripFrontmatter(await raw(R, B, `${PMD}/getting-started/getting-started.mdx`));
      const ns = stripFrontmatter(await raw(R, B, `${PMD}/getting-started/next-steps.md`));
      const up = stripFrontmatter(await raw(R, B, `${PMD}/how-to/update.md`));
      const ap = stripFrontmatter(await raw(R, B, `${PMD}/getting-started/adding-plugins.md`));
      const itz = await raw("itzg/docker-minecraft-server", "master", "docs/index.md");
      const itzBody = between(itz, "actions)\n", '!!! note "Configurator Tool"')
        .replace("[![](https://img.shields.io/badge/Donate-Buy%20me%20a%20coffee-orange.svg)](https://www.buymeacoffee.com/itzg)\n", "");
      const h = (t, s) => mdSection(t, s, { includeHeading: true });
      let body = [
        wikiLead(mc.text, 3),
        "## Getting started", demote([h(gs, "## Requirements"), h(gs, "## Downloading Paper"), h(gs, "## Running the server")].join("\n\n")),
        "## Updating", demote([up.split("## Step 1. Backup")[0].trim(), h(up, "## Step 1. Backup"), h(up, "## Step 2. Update plugins"), h(up, "## Step 3. Update Paper")].join("\n\n")),
        "## Next steps", demote([h(ns, "## Security"), h(ns, "## Backups"), h(ns, "## Making your server public")].join("\n\n")),
        "## Adding plugins", demote([ap.split("## Finding plugins")[0].trim(), h(ap, "## Finding plugins"), h(ap, "## Installing plugins")].join("\n\n")),
        "## itzg/docker-minecraft-server", demote(itzBody, 1),
      ].join("\n\n");
      body = absolutize(body, PM, { mdToDir: true, stripExt: ["md"] });
      const RTD = "https://docker-minecraft-server.readthedocs.io/en/latest";
      body = body
        .replace("(https://docs.papermc.io/versions/minecraft/)", `(${RTD}/versions/minecraft/)`)
        .replace("(https://docs.papermc.io/types-and-platforms/)", `(${RTD}/types-and-platforms/)`)
        .replaceAll("https://docs.papermc.io/misc/deployment/", `${RTD}/misc/deployment/`)
        .replace("(https://docs.papermc.io/#using-docker-compose)", "(#using-docker-compose)")
        .replace("continue to [troubleshooting](#troubleshooting)", "continue to [troubleshooting](https://docs.papermc.io/paper/adding-plugins#troubleshooting)");
      return {
        description: wikiFirstSentence(mc.text),
        sources: [
          WIKI(mc, "Lead copied verbatim."),
          await repoSource(PMSRC("Getting started", "getting-started")), await repoSource(PMSRC("Updating", "updating")),
          await repoSource(PMSRC("Next steps", "next-steps")), await repoSource(PMSRC("Adding plugins", "adding-plugins")),
          await repoSource({
            label: 'itzg/docker-minecraft-server, "Intro"', href: `${RTD}/`,
            author: "Geoff Bourne (itzg) and contributors, Apache-2.0",
            note: "Copied verbatim from docs/index.md; badges removed, links made absolute.",
            repo: "itzg/docker-minecraft-server", branch: "master",
          }),
        ],
        body: commonCleanup(mkdocsAdmonitions(docusaurusAdmonitions(body))),
      };
    },
  },
  {
    file: "immich.md", title: "Immich", group: "store", order: 1,
    tags: ["photos", "backups"], related: ["guides/syncthing", "guides/persisting-container-data", "pick-a-project"],
    description: "Here is a quick, no-choices path to install Immich and take it for a test drive.",
    async build() {
      const R = "immich-app/immich", B = "main", D = "docs/docs";
      const iq = stripFrontmatter(await raw(R, B, `${D}/overview/quick-start.mdx`));
      const ir = stripFrontmatter(await raw(R, B, `${D}/install/requirements.md`));
      const env = await raw(R, B, "docker/example.env");
      const steps = (await raw(R, B, `${D}/partials/_docker-compose-install-steps.mdx`)).replace(
        '<CodeBlock language="bash" title="Default environmental variable content">\n  {ExampleEnv}\n</CodeBlock>',
        '```bash title="Default environmental variable content"\n' + env.trim() + "\n```",
      );
      const reg = await raw(R, B, `${D}/partials/_register-admin.md`);
      const bk = await raw(R, B, `${D}/partials/_server-backup.md`);
      const body = [
        iq.split("## Requirements")[0].replace("# Quick start", "").trim(),
        "## Requirements", mdSection(iq, "## Requirements").split("---")[0].trim(),
        "### Hardware", mdSection(ir, "## Hardware").split("### Special")[0].trim(),
        "### Software", mdSection(ir, "## Software").split("### Special")[0].trim(),
        "## Set up the server", steps,
        "## Try the web app", reg.trim(), "Try uploading a picture from your browser.",
        "## Review the database backup and restore process", mdSection(iq, "## Review the database backup and restore process").split("---")[0].trim(),
        "## Setup Server Backups", bk.trim(),
      ].join("\n\n");
      return {
        sources: [
          await repoSource(IMSRC("Quick start", "overview/quick-start")), await repoSource(IMSRC("Requirements", "install/requirements")),
          await repoSource(IMSRC("Docker Compose [Recommended]", "install/docker-compose")), await repoSource(IMSRC("Post installation steps", "install/post-install")),
        ],
        body: commonCleanup(docusaurusAdmonitions(absolutize(body, IM, { stripExt: ["md", "mdx"] }))),
      };
    },
  },
  {
    file: "navidrome.md", title: "Navidrome", group: "listen", order: 1,
    tags: ["music"], related: ["guides/jellyfin", "pick-a-project"],
    description: "Navidrome can be used as a standalone server, that allows you to browse and listen to your music collection using a web browser.",
    async build() {
      const R = "navidrome/website", B = "master", D = "content/en/docs";
      const ov = stripFrontmatter(await raw(R, B, `${D}/overview/_index.md`));
      const dk = stripFrontmatter(await raw(R, B, `${D}/installation/docker.md`));
      const alert = /\{\{% alert.*?\{\{%\/alert%\}\}/s.exec(ov)?.[0];
      if (!alert) throw new Error("Navidrome overview: alert block not found");
      const body = [
        ov.split("## Features")[0].trim(),
        "## Features", mdSection(ov, "## Features").split("### Features supported")[0].trim(),
        hugoCleanup(alert),
        "## Installing with Docker", dk.trim(),
      ].join("\n\n");
      const src = (title, p, note) => repoSource({ label: `Navidrome documentation, "${title}"`, href: `${NV}/docs/${p}/`, author: "Navidrome contributors, Apache-2.0", note, repo: R, branch: B });
      return {
        sources: [await src("Navidrome Overview", "overview", "Copied verbatim; app catalog image removed, links made absolute."), await src("Installing with Docker", "installation/docker", "Copied verbatim; links made absolute.")],
        body: commonCleanup(hugoCleanup(absolutize(body, NV))),
      };
    },
  },
  {
    file: "tubearchivist.md", title: "Tube Archivist", group: "watch", order: 3,
    tags: ["youtube", "video"], related: ["guides/jellyfin", "guides/how-compose-works"],
    description: "Home of the documentation, additional installation instructions and user guide. Recommended reading for all interested in the project.",
    async build() {
      const R = "tubearchivist/docs", B = "master", D = "mkdocs/docs";
      const ti = stripFrontmatter(await raw(R, B, `${D}/index.md`));
      const tc = await raw(R, B, `${D}/installation/docker-compose.md`);
      const h = (s) => mdSection(tc, s, { includeHeading: true });
      let body = [
        "Welcome to the official Tube Archivist Docs. This is an up-to-date documentation of user functionality.",
        "## Getting Started", mdSection(ti, "## Getting Started"),
        "## Setting up Tube Archivist with Docker",
        demote([h("## Overview"), h("## Install **Tube Archivist**"),
          h("## Install **Redis**").split("### Redis on a custom port")[0].trim(),
          h("## Install **ElasticSearch**").split("### Elasticsearch on a custom port")[0].trim()].join("\n\n")),
      ].join("\n\n");
      body = absolutize(body, TA, { mdToDir: true, stripExt: ["md"] })
        .replaceAll(`${TA}/env-vars`, `${TA}/installation/env-vars`)
        .replaceAll(`${TA}/docker-for-beginners`, `${TA}/installation/docker-for-beginners`);
      const src = (label, href, note) => repoSource({ label, href, author: "Tube Archivist contributors, GPL-3.0", note, repo: R, branch: B });
      return {
        sources: [
          await src("Tube Archivist Docs, home page", `${TA}/`, "Welcome line and Getting Started list copied verbatim; icons removed."),
          await src('Tube Archivist Docs, "Setting up Tube Archivist with Docker"', `${TA}/installation/docker-compose/`, "Copied verbatim; the custom-port subsections left out, links made absolute."),
        ],
        body: commonCleanup(mkdocsAdmonitions(body)),
      };
    },
  },
  {
    file: "pi-hole.md", title: "Pi-hole", group: "else", order: 2,
    tags: ["dns", "ads", "network"], related: ["guides/what-is-a-container", "self-hosting-basics"],
    async build() {
      const pw = await wiki("Pi-hole");
      const R = "pi-hole/docs", B = "master";
      const pre = stripFrontmatter(await raw(R, B, "docs/main/prerequisites.md"));
      const pdk = await raw(R, B, "docs/docker/index.md");
      const bi = await raw(R, B, "docs/main/basic-install.md");
      const po = await raw(R, B, "docs/main/post-install.md");
      const h = (s) => mdSection(pre, s, { includeHeading: true });
      let body = [
        wikiLead(pw.text),
        "## Prerequisites", demote([h("## Hardware"), h("## IP Addressing"), h("## Ports")].join("\n\n")),
        "## Docker", pdk.split("## Docker tags and versioning")[0].trim(),
        "## One-Step Automated Install", mdSection(bi, "## One-Step Automated Install").split("### Alternative 1")[0].trim(),
        "## Making your network take advantage of Pi-hole", mdSection(po, "## Making your network take advantage of Pi-hole"),
      ].join("\n\n");
      body = absolutize(body, PH, { mdToDir: true, stripExt: ["md"] });
      const src = (title, p, note) => repoSource({ label: `Pi-hole documentation, "${title}"`, href: `${PH}/${p}/`, author: "Pi-hole LLC and contributors, CC BY-SA 4.0", note, repo: R, branch: B });
      return {
        description: wikiFirstSentence(pw.text),
        sources: [
          WIKI(pw, "Lead copied verbatim."),
          await src("Prerequisites", "main/prerequisites", "Hardware, IP Addressing and Ports copied verbatim; links made absolute."),
          await src("Docker", "docker", "Quick-start section copied verbatim."),
          await src("Installation", "main/basic-install", "One-Step Automated Install copied verbatim."),
          await src("Post-Install", "main/post-install", "First section copied verbatim."),
        ],
        body: commonCleanup(mkdocsAdmonitions(body)),
      };
    },
  },
  {
    file: "syncthing.md", title: "Syncthing", group: "store", order: 2,
    tags: ["files", "backups"], related: ["guides/immich", "self-hosting-basics"],
    async build() {
      const sy = await wiki("Syncthing");
      return {
        description: wikiFirstSentence(sy.text),
        sources: [WIKI(sy, "Lead, Technology and Configuration and management sections copied verbatim.")],
        body: [wikiLead(sy.text), "## Technology", wikiSection(sy.text, "Technology"),
          "## Configuration and management", wikiSection(sy.text, "Configuration and management"),
          "Official documentation: [docs.syncthing.net](https://docs.syncthing.net/)."].join("\n\n"),
      };
    },
  },
];

/* ── writing ──────────────────────────────────────────────────────────────── */

const yq = (s) => JSON.stringify(s);

function render({ title, description, group, order, tags = [], related = [], sources, synced, body }) {
  const lines = ["---", `title: ${yq(title)}`];
  if (description) lines.push(`description: ${yq(description)}`);
  lines.push(`group: ${group}`, `order: ${order}`);
  if (tags.length) lines.push(`tags: [${tags.join(", ")}]`);
  if (related.length) lines.push("related:", ...related.map((r) => `  - ${r}`));
  lines.push(`synced: ${yq(synced)}`, "sources:");
  for (const s of sources) {
    lines.push(`  - label: ${yq(s.label)}`, `    href: ${yq(s.href)}`);
    if (s.author) lines.push(`    author: ${yq(s.author)}`);
    if (s.note) lines.push(`    note: ${yq(s.note)}`);
  }
  lines.push("---", "", body.replace(/^\n+|\n+$/g, ""), "");
  return lines.join("\n");
}

/** The page without its frontmatter: what "the text changed" means. */
const bodyOf = (text) => text.replace(/^---\n[\s\S]*?\n---\n/, "");

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const results = await Promise.allSettled(recipes.map((r) => r.build().then((p) => ({ ...r, ...p }))));
  const failures = results.filter((r) => r.status === "rejected");
  if (failures.length) {
    for (const f of failures) console.error(`sync-guides: ${f.reason?.message ?? f.reason}`);
    process.exit(1);
  }

  let changed = 0;
  for (const { value: page } of results) {
    const target = path.join(OUT, page.file);
    let existing = null;
    try { existing = await fs.readFile(target, "utf8"); } catch {}
    let fresh = render({ ...page, synced: TODAY });
    if (existing && bodyOf(existing) === bodyOf(fresh)) {
      // Same words: keep the credit exactly as it was (date and revisions),
      // and only re-render what the recipe owns: place, tags, related.
      const kept = matter(existing).data;
      fresh = render({ ...page, synced: kept.synced, sources: kept.sources ?? page.sources });
      if (fresh === existing) continue;
    }
    changed += 1;
    if (CHECK) { console.log(`stale: ${page.file}`); continue; }
    await fs.writeFile(target, fresh, "utf8");
    console.log(`${existing ? "updated" : "created"}: ${page.file}`);
  }
  if (CHECK && changed) process.exit(1);
  console.log(`sync-guides: ${changed} page(s) ${CHECK ? "stale" : "written"}, ${results.length - changed} unchanged`);
}

await main();
