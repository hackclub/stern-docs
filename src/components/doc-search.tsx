"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type SearchEntry = {
  href: string;
  title: string;
  description: string | null;
  group: string | null;
  /** Topics from the page's frontmatter: "movies", "games". */
  tags: string[];
  /** Whole page as plain text, built at render time in lib/markdown.ts. */
  text: string;
};

type Hit = SearchEntry & { score: number; snippet: string };

/**
 * Search over a prebuilt index shipped with the page.
 *
 * A program's docs are tens of pages, not thousands, so the entire corpus is
 * smaller than one search-service round trip  there's no API route, no index
 * build step and no third-party script, and it works inside an embed where a
 * cross-origin search request often wouldn't.
 */
function score(entry: SearchEntry, tokens: string[]): number {
  const title = entry.title.toLowerCase();
  const description = (entry.description ?? "").toLowerCase();
  const text = entry.text.toLowerCase();
  const tags = entry.tags.join(" ");

  let total = 0;
  for (const token of tokens) {
    // Every token has to appear somewhere, so "devlog hours" doesn't match a
    // page that only knows about hours.
    if (
      !title.includes(token) &&
      !description.includes(token) &&
      !tags.includes(token) &&
      !text.includes(token)
    ) {
      return 0;
    }
    if (title.startsWith(token)) total += 12;
    else if (title.includes(token)) total += 8;
    // A tag is a word the page chose for itself: "games" finds the Minecraft
    // page even though its title never says so.
    if (tags.includes(token)) total += 6;
    if (description.includes(token)) total += 3;
    if (text.includes(token)) total += 1;
  }
  return total;
}

/** ~140 characters of the page around the first hit, so the match is visible. */
function snippetFor(text: string, token: string): string {
  const at = text.toLowerCase().indexOf(token);
  if (at < 0) return text.slice(0, 140);
  const from = Math.max(0, at - 55);
  return `${from > 0 ? "…" : ""}${text.slice(from, from + 140).trim()}…`;
}

export function DocSearch({ entries }: { entries: SearchEntry[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);

  const hits = useMemo<Hit[]>(() => {
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return [];
    return entries
      .map((entry) => ({
        ...entry,
        score: score(entry, tokens),
        snippet: snippetFor(entry.text, tokens[0]),
      }))
      .filter((hit) => hit.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [entries, query]);

  // Opening and closing both reset the query, done at the call sites rather than
  // in an effect watching `open`  same result, one render instead of two.
  const openPanel = () => {
    setQuery("");
    setCursor(0);
    setOpen(true);
  };

  const closePanel = () => {
    setQuery("");
    setCursor(0);
    setOpen(false);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openPanel();
      }
      if (event.key === "Escape") closePanel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }); // No dep array: the handlers close over current state by design.

  const go = (href: string) => {
    closePanel();
    router.push(href);
  };

  return (
    <>
      <button type="button" className="search-trigger" onClick={openPanel}>
        <span>Search docs</span>
        <kbd className="tabular">⌘K</kbd>
      </button>

      {open ? (
        <div
          className="search-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closePanel();
          }}
        >
          <div
            className="search-panel panel"
            role="dialog"
            aria-modal="true"
            aria-label="Search documentation"
          >
            <input
              // The dialog only exists once someone asked for it, so focus
              // belongs in the field rather than behind another keystroke.
              autoFocus
              className="search-input"
              value={query}
              placeholder="Search the docs"
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => {
                setQuery(event.target.value);
                setCursor(0);
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setCursor((value) => Math.min(value + 1, hits.length - 1));
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setCursor((value) => Math.max(value - 1, 0));
                } else if (event.key === "Enter" && hits[cursor]) {
                  event.preventDefault();
                  go(hits[cursor].href);
                }
              }}
            />

            <ul className="search-results">
              {hits.map((hit, index) => (
                <li key={hit.href}>
                  <button
                    type="button"
                    className={
                      index === cursor
                        ? "search-hit search-hit-active"
                        : "search-hit"
                    }
                    onMouseEnter={() => setCursor(index)}
                    onClick={() => go(hit.href)}
                  >
                    <span className="search-hit__title">{hit.title}</span>
                    <span className="search-hit__snippet">{hit.snippet}</span>
                  </button>
                </li>
              ))}
            </ul>

            <p className="search-foot silkscreen">
              {query === ""
                ? "Type to search · ↑↓ to move · ↵ to open"
                : hits.length === 0
                  ? "Nothing matches. Try fewer words."
                  : `${hits.length} ${hits.length === 1 ? "page" : "pages"}`}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
