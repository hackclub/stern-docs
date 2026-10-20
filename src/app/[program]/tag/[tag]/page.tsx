import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  listPrograms,
  loadProgramContent,
  normalizeTag,
  tagIndex,
} from "@/lib/content";

export const revalidate = 300;

type Params = { params: Promise<{ program: string; tag: string }> };

/**
 * Every page on one topic. A tag is a word a page chose for itself in its
 * frontmatter ("movies", "games"), so this is the answer to "where's the one
 * about movies?" without knowing which section it was filed under.
 *
 * Static, like the pages, and kept out of search engines: the pages carry
 * the content, this just points at them.
 */
export async function generateStaticParams() {
  const programs = await listPrograms();
  const params = await Promise.all(
    programs.map(async (program) => {
      const content = await loadProgramContent(program);
      return content ? tagIndex(content).map(({ tag }) => ({ program, tag })) : [];
    }),
  );
  return params.flat();
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { program, tag } = await params;
  const content = await loadProgramContent(program);
  if (!content) return {};
  const name = normalizeTag(decodeURIComponent(tag));
  return {
    title: `Tagged ${name}`,
    robots: { index: false, follow: true },
    alternates: { canonical: `/${program}/tag/${name}` },
  };
}

export default async function TagPage({ params }: Params) {
  const { program, tag } = await params;
  const content = await loadProgramContent(program);
  if (!content) notFound();

  const name = normalizeTag(decodeURIComponent(tag));
  const index = tagIndex(content);
  const entry = index.find((candidate) => candidate.tag === name);
  if (!entry) notFound();

  return (
    <div className="doc-shell">
      <article className="doc">
        <header className="doc-head">
          <p className="silkscreen doc-eyebrow">Topic</p>
          <h1 className="display doc-title">{name}</h1>
        </header>

        <section className="section-card panel">
          <ul>
            {entry.docs.map((doc) => (
              <li key={doc.href}>
                <Link className="section-link" href={doc.href}>
                  <span className="led" aria-hidden />
                  <span>
                    <span className="section-link__title">{doc.title}</span>
                    {doc.description ? (
                      <span className="section-link__desc">{doc.description}</span>
                    ) : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* The other topics, so a wrong guess is one click from a right one. */}
        <ul className="tags tags--all" aria-label="All topics">
          {index
            .filter((candidate) => candidate.tag !== name)
            .map((candidate) => (
              <li key={candidate.tag}>
                <Link className="tag" href={`/${program}/tag/${candidate.tag}`}>
                  {candidate.tag}
                  <span className="tag__count tabular">{candidate.docs.length}</span>
                </Link>
              </li>
            ))}
        </ul>
      </article>
    </div>
  );
}
