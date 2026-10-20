---
title: How to edit these docs
description: Every page is a markdown file and every change is a pull request. Here's the whole workflow.
group: help
order: 2
---

If a page here is wrong, unclear, or missing the thing you spent an hour working
out, you can fix it.

These docs live in one public repo **[AD-Archer/stern-docs](https://github.com/AD-Archer/stern-docs)** alongside the docs
for every other Archer program on Stern. It's markdown inside of a content folder.

## The fast way, from the browser

1. Scroll to the bottom of the page that's wrong.
2. Click **Suggest an edit**. GitHub opens that page's markdown file in an editor.
3. Make the change. If you don't have write access, GitHub forks the repo for you
   automatically that's expected.
4. Write one line about what you changed and click **Propose changes**, then
   **Create pull request**.

That's it. A maintainer reviews it, and when it merges the site updates itself.

## The local way

```bash
git clone https://github.com/AD-Archer/stern-docs
cd stern-docs
pnpm install
pnpm dev            # http://localhost:3000
```

Each program's pages live in `content/<program>/` CloudFALL's in
`content/cloudfall/`, and every other program in a folder beside it. Pages that
belong to no single program, like this one, live in `content/_shared/` and are
served under every program. Edit a `.md` file, save, and the page reloads.

## What a page looks like

```markdown
---
title: Getting started
description: One sentence, used in search results and on the share card.
group: start
order: 1
---

Body text, in markdown.
```

| Field         | What it does                                                                                                     |
| ------------- | ---------------------------------------------------------------------------------------------------------------- |
| `title`       | Heading, sidebar label, browser tab, share card                                                                  |
| `description` | The lede under the title, plus search and social previews                                                        |
| `group`       | Which section of the sidebar it appears in must match an `id` in `docs.json`                                     |
| `order`       | Position within the section; ties break alphabetically                                                           |
| `hidden`      | `true` keeps it out of the nav and search, but the URL still works good for a draft you want to share for review |
| `author`      | Who wrote the page. Falls back to the site's author                                                              |
| `sources`     | Where copied text came from: a list of `label`, `href`, `author`, `note`. Rendered at the foot of the page       |

Filenames become URLs: `content/cloudfall/getting-started.md` is
`/cloudfall/getting-started`. A folder's `index.md` is the folder's own page.

## Things markdown gives you here

Callouts, using GitHub's own alert syntax so they look right in the pull request
diff too:

```markdown
> [!NOTE]
> Useful context that isn't a warning.

> [!WARNING]
> The thing that will cost someone an afternoon.
```

Code blocks with a filename label:

````markdown
```yaml title="docker-compose.yml"
services:
  app:
    build: .
```
````

Tables, task lists, footnotes anything GitHub-flavoured markdown supports.

## A few notes

- **Write for the person who's stuck**, not for the person who already knows.
- **Be specific.** Port numbers, exact commands, real file names.
- **Don't put dates or deadlines in prose.** They come from the program itself and
  show in the header and sidebar; a hardcoded date is a page that lies later.
- **Keep it short.** If a page needs eight headings, it's probably two pages.
- **Write it yourself.** Pages here are written by people who've done the thing.
  Generated prose reads fine and says nothing, and it gets rejected.

## Adding a whole new program's docs

Make a folder under `content/`, add a `docs.json` and an `index.md`, and the
site does the rest routes, navigation, search, share cards, and a palette
pulled from that program's own artwork.
