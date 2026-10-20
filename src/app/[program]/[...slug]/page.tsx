import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocView } from "@/components/doc-view";
import { findDoc, listPrograms, loadProgramContent } from "@/lib/content";
import { rawUrl } from "@/lib/llms";
import { authorOf } from "@/lib/seo";

export const revalidate = 300;

type Params = { params: Promise<{ program: string; slug: string[] }> };

export async function generateStaticParams() {
  const programs = await listPrograms();
  const params = await Promise.all(
    programs.map(async (program) => {
      const content = await loadProgramContent(program);
      return (content?.docs ?? [])
        .filter((doc) => doc.segments.length > 0)
        .map((doc) => ({ program, slug: doc.segments }));
    }),
  );
  return params.flat();
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { program, slug } = await params;
  const content = await loadProgramContent(program);
  const doc = content ? findDoc(content, slug) : null;
  if (!content || !doc) return {};

  // The layout template appends "· CloudFALL docs"; the share tags spell it
  // out because og:title doesn't go through the template.
  const fullTitle = `${doc.title} · ${content.config.title}`;
  const description = doc.description ?? undefined;
  const section = content.nav.find((group) => group.id === doc.group)?.label;
  const author = doc.author ?? authorOf(content.config).name;
  const image = `/og?program=${encodeURIComponent(program)}&slug=${encodeURIComponent(
    slug.join("/"),
  )}`;
  return {
    title: doc.title,
    description,
    alternates: {
      canonical: doc.href,
      // So a client that would rather have the source can find it without
      // guessing the URL scheme.
      types: { "text/markdown": rawUrl(program, slug) },
    },
    openGraph: {
      title: fullTitle,
      description,
      url: doc.href,
      type: "article",
      section,
      authors: [author],
      images: [{ url: image, width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
    },
  };
}

export default async function DocPage({ params }: Params) {
  const { program, slug } = await params;
  const content = await loadProgramContent(program);
  if (!content) notFound();

  const doc = findDoc(content, slug);
  // Hidden docs are reachable by direct link on purpose  a draft can be shared
  // for review without appearing in the nav  but they never show up in search.
  if (!doc) notFound();

  return <DocView content={content} doc={doc} />;
}
