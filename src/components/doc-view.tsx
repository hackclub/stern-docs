import { OnThisPage } from "@/components/on-this-page";
import { PageActions } from "@/components/page-actions";
import { Pager } from "@/components/pager";
import { Sources } from "@/components/sources";
import {
  editUrl,
  neighbours,
  type Doc,
  type ProgramContent,
} from "@/lib/content";
import { rawUrl } from "@/lib/llms";
import { renderMarkdown } from "@/lib/markdown";
import { articleJsonLd, authorOf, breadcrumbJsonLd, jsonLd } from "@/lib/seo";
import { CONTENT_BRANCH, CONTENT_REPO, SITE_URL } from "@/lib/site";

/**
 * One documentation page: eyebrow, title, lede, body, and the two rails of
 * everything-else (contents on the right, actions and pager at the foot).
 *
 * The eyebrow is the doc's section, which is real information  it tells you
 * whether you're reading setup or shipping rules  as opposed to a decorative
 * "01 / 02 / 03" that would imply an order these pages don't all have.
 */
export async function DocView({
  content,
  doc,
  art,
  children,
}: {
  content: ProgramContent;
  doc: Doc;
  /** The program's wordmark, standing in for the title on the docs home. */
  art?: React.ReactNode;
  /** Extra blocks after the prose  the home page's section index uses this. */
  children?: React.ReactNode;
}) {
  const { html, headings } = await renderMarkdown(doc.body);
  const { previous, next } = neighbours(content, doc);
  const edit = editUrl(doc, content.config, CONTENT_REPO, CONTENT_BRANCH);
  const group = content.nav.find((entry) => entry.id === doc.group);
  const section = group?.label;
  const siteAuthor = authorOf(content.config);
  const canonical = `${SITE_URL}${doc.href}`;
  const isHome = doc.segments.length === 0;

  // The share card for this exact page, so the structured data and the
  // og:image agree on what the page looks like.
  const image = isHome
    ? `${SITE_URL}/${content.program}/opengraph-image`
    : `${SITE_URL}/og?program=${encodeURIComponent(content.program)}&slug=${encodeURIComponent(doc.segments.join("/"))}`;

  const crumbs = [
    { name: content.config.title, url: `${SITE_URL}/${content.program}` },
    ...(group
      ? [{ name: group.label, url: `${SITE_URL}${group.docs[0]?.href ?? doc.href}` }]
      : []),
    ...(isHome ? [] : [{ name: doc.title, url: canonical }]),
  ];

  return (
    <div className="doc-shell">
      <article className="doc">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd(
              articleJsonLd({
                title: doc.title,
                description: doc.description,
                url: canonical,
                image,
                section: section ?? null,
                siteName: content.config.title,
                config: content.config,
              }),
            ),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbJsonLd(crumbs)) }}
        />

        <header className="doc-head">
          {art ? (
            <>
              {art}
              <h1 className="sr-only">{doc.title}</h1>
            </>
          ) : (
            <>
              <p className="silkscreen doc-eyebrow">
                {section ?? content.config.title}
              </p>
              <h1 className="display doc-title">{doc.title}</h1>
            </>
          )}
          {doc.description ? (
            <p className="doc-lede">{doc.description}</p>
          ) : null}
        </header>

        <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />

        {children}

        <Sources
          author={doc.author ?? siteAuthor.name}
          authorHref={doc.author ? null : siteAuthor.url}
          sources={doc.sources}
        />

        <PageActions
          canonicalUrl={canonical}
          markdownUrl={rawUrl(content.program, doc.segments)}
          markdown={doc.body}
          editUrl={edit}
        />
        <Pager previous={previous} next={next} />
      </article>

      <OnThisPage headings={headings} />
    </div>
  );
}
