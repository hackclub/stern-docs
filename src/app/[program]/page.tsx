import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocView } from "@/components/doc-view";
import { findDoc, loadProgramContent, programName } from "@/lib/content";
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
    // The layout's template would otherwise render "CloudFALL docs · CloudFALL docs".
    title: { absolute: content.config.title },
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
 * When docs.json names a wordmark, it stands where the title would: the one
 * piece of the program's own art on the page, drawn as drawn. The h1 stays in
 * the document for crawlers and screen readers, just not on screen twice.
 */
export default async function ProgramHome({ params }: Params) {
  const { program } = await params;
  const content = await loadProgramContent(program);
  if (!content) notFound();

  const home = findDoc(content, []);
  if (!home) notFound();

  const brand = content.config.brand;
  const art = brand?.wordmark ? (
    <Image
      className="doc-art"
      src={brand.wordmark}
      alt={brand.wordmarkAlt ?? programName(content.config)}
      width={1602}
      height={599}
      priority
      unoptimized
    />
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
      </DocView>
    </>
  );
}
