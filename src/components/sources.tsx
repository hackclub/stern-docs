import type { DocSource } from "@/lib/content";

/**
 * The credit line every page ends with.
 *
 * Nothing on this site is generated: a page is written by a named person, or
 * its text is copied unchanged from somewhere that is named here. That rule is
 * only worth anything if the credit travels with the text, so this renders on
 * every page, next to the words it covers, rather than on a credits page
 * nobody opens. The same facts go out in /raw/… and /llms-full.txt.
 */
export function Sources({
  author,
  authorHref,
  sources,
}: {
  author: string;
  authorHref: string | null;
  sources: DocSource[];
}) {
  return (
    <section className="sources" aria-labelledby="sources-title">
      <h2 id="sources-title" className="silkscreen">
        {sources.length > 0 ? "Sources" : "Written by"}
      </h2>

      {sources.length > 0 ? (
        <ul className="sources__list">
          {sources.map((source) => (
            <li key={`${source.label}:${source.href ?? ""}`}>
              {source.href ? (
                <a href={source.href} target="_blank" rel="noreferrer">
                  {source.label}
                </a>
              ) : (
                <span>{source.label}</span>
              )}
              {source.author ? (
                <span className="sources__author"> · {source.author}</span>
              ) : null}
              {source.note ? (
                <span className="sources__note">{source.note}</span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <p className="sources__page">
        {sources.length > 0 ? "Page by " : ""}
        {authorHref ? (
          <a href={authorHref} target="_blank" rel="noreferrer">
            {author}
          </a>
        ) : (
          author
        )}
      </p>
    </section>
  );
}
