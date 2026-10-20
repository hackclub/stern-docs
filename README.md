# Stern program docs

Embeddable documentation for participants in [Hack Club](https://hackclub.com)
YSWS programs, living at
[AD-Archer/stern-docs](https://github.com/AD-Archer/stern-docs). Markdown in, themed
docs site out with a live countdown and join button that read the program from
stern and disappear when the round closes.

```
content/cloudfall/          →  https://sterndocs.hackclub.com/cloudfall
  docs.json                    site config: title, sections, links
  index.md                     the docs home
  getting-started.md           /cloudfall/getting-started
  shipping/devlogs.md          /cloudfall/shipping/devlogs
```

Adding another program is a folder beside it — see [Adding a program](#adding-a-program).

## Run it

```bash
pnpm install
pnpm dev            # http://localhost:3000 → redirects to the default program
```

No environment variables are needed for local development.

## How it works

**Content** is markdown on disk, read at build/revalidation time
([`src/lib/content.ts`](src/lib/content.ts)). Filenames become URLs, frontmatter
becomes navigation, and the body becomes HTML, a heading list, and a search index
([`src/lib/markdown.ts`](src/lib/markdown.ts)). No database, no CMS which is the
point: **every change to these docs is a pull request.**

**Liveness** comes from stern's public API, e.g.
`https://stern.hackclub.com/api/public/programs/cloudfall`. It supplies the
program name, dates, Slack channel, hours shipped, artwork and join link. It's a
soft dependency: if stern is unreachable, the round status and join panel are
simply not rendered and the documentation is unaffected
([`src/lib/program.ts`](src/lib/program.ts)).

The schedule is recomputed from `startsAt`/`endsAt` locally rather than trusting
the API's own `hasEnded`, and again on the client on a ticking clock so a page
cached while the round was open can never keep inviting people to join a round
that has closed ([`src/lib/schedule.ts`](src/lib/schedule.ts)).

**The palette comes from the program's `accentColor`**, the brand color set by
whoever runs it so the docs match the program's own stern pages rather than
approximating them. CloudFALL's `#543efa` gives purple docs; Future's `#51b9e6`
gives blue ones. That one hex generates every token on the page using the same
OKLCH formulas stern uses, which is what makes framed docs look native inside
stern ([`src/lib/theme.ts`](src/lib/theme.ts)).


Precedence: `theme.brand` in `docs.json` → `accentColor` → artwork → Hack Club red
([`src/lib/seed.ts`](src/lib/seed.ts)). A program that would rather be themed from
its artwork than its accent sets `theme.source: "images"` in its `docs.json`.

## Embedding

Every page is embeddable. `/embed` is a builder with a live preview; the short
version:

```html
<div data-stern-docs="https://docs.example.com/cloudfall"></div>
<script src="https://docs.example.com/embed.js" defer></script>
```

The frame reports its height on every layout change and `embed.js` applies it, so
there's no fixed height and no nested scrollbar. `data-nav="0"` drops the header
and contents rail for a host that has its own; it maps to `?embed=1&nav=0`, read
before first paint ([`src/lib/boot-script.ts`](src/lib/boot-script.ts)) so a host
page never sees a flash of full-site chrome.

The site is **light only** one surface per program, no appearance switch, and
nothing to negotiate with a host page's theme.

> [!NOTE]
> Testing an embed from a `file://` page won't work `frame-ancestors *` doesn't
> match non-network schemes. Serve the host page over http(s), even locally.

### Inside stern

Add a route that frames it for example `apps/web/src/app/a/[appSlug]/docs/page.tsx`:

```tsx
export default async function DocsPage({ params }) {
  const { appSlug } = await params;
  const src = `${process.env.DOCS_URL}/${appSlug}?embed=1`;
  return (
    <iframe
      src={src}
      title="Documentation"
      className="w-full border-0"
      style={{ height: "100vh" }}
    />
  );
}
```

…and either ship the resize listener from `/embed`, or keep the fixed height if
stern's own page is already the scroll container.

## For LLMs and copy-paste

Every page is available as its own markdown, so a model gets the source instead of
a rendering ([`src/lib/llms.ts`](src/lib/llms.ts)):

| URL                     | What it returns                                                    |
| ----------------------- | ------------------------------------------------------------------ |
| `/llms.txt`             | llmstxt.org-shaped index: every program, every page, one line each |
| `/llms-full.txt`        | The whole corpus in one response; `?program=<slug>` to narrow it   |
| `/raw/<program>/<page>` | One page's markdown, with a provenance comment on top              |

All three are `text/plain`-family, CORS-open, and revalidated every 5 minutes. The
index and full-text responses carry a **generated status line** open, closes on
this date, or closed and archived computed at request time, because the one thing
a model must not do with these docs is invite someone into a round that has ended.

In the UI, the same content is one click away: **Copy as Markdown** at the foot of
every page copies that page's source, and **View source** opens `/raw/…`.

## Synced guides

`content/cloudfall/guides/` is copied text, never edited by hand. Each page's
recipe lives in [`scripts/sync-guides.mjs`](scripts/sync-guides.mjs):

```bash
pnpm sync:guides            # rewrite pages whose upstream text changed
pnpm sync:guides --check    # exit 1 if any page is stale, write nothing
```

| What                                | Where                                                |
| ----------------------------------- | ---------------------------------------------------- |
| Source, licence, revision per page  | `sources:` frontmatter, rendered at the foot of the page |
| Last regenerated                    | `synced:` frontmatter                                |
| Weekly rerun, opens a pull request  | [`.github/workflows/sync-guides.yml`](.github/workflows/sync-guides.yml) |

## Adding a program

```bash
mkdir content/<slug>            # matching the program's stern slug
```

Add a `docs.json` and an `index.md` (copy CloudFALL's as a starting point). Routes,
navigation, search, share cards, the round status and the palette all follow from
the folder name plus stern's API.

## Editing content

See [How to edit these docs](content/_shared/contributing.md) it's a docs page
because contributors need it more than maintainers do. Every page's footer and
"Suggest an edit" button point back at this repo, so a reader who spots an error is
two clicks from a pull request.
