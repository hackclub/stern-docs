import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocView } from "@/components/doc-view";
import { Horizon } from "@/components/horizon";
import {
  findDoc,
  loadProgramContent,
  programName,
  tagHref,
  tagIndex,
} from "@/lib/content";
import { jsonLd, websiteJsonLd } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

export const revalidate = 300;

type Params = { params: Promise<{ program: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { program } = await params;
  const content = await loadProgramContent(program);
  if (!content) return {};
  const home = findDoc(content, []);
  const description = home?.description ?? content.config.tagline ?? undefined;
  return {
    // The layout's template would otherwise render "CloudFALL docs · CloudFALL
    // docs"; the organisation goes on the home title instead, where someone
    // searching for the program by name and sponsor lands.
    title: { absolute: `${content.config.title} · Hack Club` },
    description,
    alternates: { canonical: `/${program}` },
    openGraph: {
      title: content.config.title,
      description,
      url: `/${program}`,
      type: "website",
    },
    // Nested metadata objects replace rather than merge, so the card type has
    // to be restated here or it falls back to the small "summary" card.
    twitter: { card: "summary_large_image", title: content.config.title, description },
  };
}

/**
 * The docs home. Renders content/<program>/index.md, then the section index
 * on a landing page the fastest thing you can give someone is the shape of the
 * whole manual.
 *
 * When docs.json names a wordmark, it stands where the title would, on a band
 * of sky: the one piece of the program's own art on the page. The h1 stays in
 * the document for crawlers and screen readers, just not on screen twice.
 */
export default async function ProgramHome({ params }: Params) {
  const { program } = await params;
  const content = await loadProgramContent(program);
  if (!content) notFound();

  const home = findDoc(content, []);
  if (!home) notFound();

  // The sky: the program's wordmark on a pale band of its own colour, closed
  // by a hand-drawn horizon where the paper starts. The art is drawn as drawn.
  const topics = tagIndex(content);
  const brand = content.config.brand;
  const art = brand?.wordmark ? (
    <div className="sky">
      <Image
        className="sky__art"
        src={brand.wordmark}
        alt={brand.wordmarkAlt ?? programName(content.config)}
        width={1602}
        height={599}
        sizes="(min-width: 1024px) 38rem, 100vw"
        priority
      />
      <Horizon className="sky__horizon" />
    </div>
  ) : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            websiteJsonLd({
              name: content.config.title,
              url: `${SITE_URL}/${program}`,
            }),
          ),
        }}
      />
      <DocView content={content} doc={home} art={art}>
        <div className="section-index">
          {content.nav.map((group) => (
            <section className="section-card panel" key={group.id}>
              <h2 className="silkscreen">{group.label}</h2>
              {group.blurb ? (
                <p className="section-card__blurb">{group.blurb}</p>
              ) : null}
              <ul>
                {group.docs.map((doc) => (
                  <li key={doc.href}>
                    <Link className="section-link" href={doc.href}>
                      <span className="led" aria-hidden />
                      <span>
                        <span className="section-link__title">{doc.title}</span>
                        {doc.description ? (
                          <span className="section-link__desc">
                            {doc.description}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {topics.length > 0 ? (
          // Every topic any page claimed, biggest first: the cross-cut through
          // the sections above for someone who knows what they want, not where
          // it was filed.
          <section className="topics" aria-labelledby="topics-title">
            <h2 id="topics-title" className="silkscreen">
              Topics
            </h2>
            <ul className="tags tags--all">
              {topics.map(({ tag, docs }) => (
                <li key={tag}>
                  <Link className="tag" href={tagHref(program, tag)}>
                    {tag}
                    <span className="tag__count tabular">{docs.length}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </DocView>
    </>
  );
}
