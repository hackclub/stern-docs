import { findDoc, loadProgramContent } from "@/lib/content";
import { docOgImage } from "@/lib/og";

/**
 * Share cards for individual doc pages.
 *
 * A route rather than an `opengraph-image.tsx` beside the page, because the doc
 * route is a catch-all (`[...slug]`) and Next won't allow a segment after one
 * so the page's generateMetadata points at `/og?program=…&slug=…` instead.
 */
export const revalidate = 3600;

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const program = params.get("program");
  if (!program) return new Response("Missing program", { status: 400 });

  const content = await loadProgramContent(program);
  if (!content) return new Response("Unknown program", { status: 404 });

  const segments = (params.get("slug") ?? "").split("/").filter(Boolean);
  const doc = findDoc(content, segments);
  const section = doc
    ? content.nav.find((group) => group.id === doc.group)?.label
    : null;

  return docOgImage(program, {
    title: doc?.title ?? content.config.title,
    description: doc?.description ?? null,
    section: section ?? null,
    path: doc?.href ?? `/${program}`,
  });
}
