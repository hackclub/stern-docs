import { findDoc, loadProgramContent } from "@/lib/content";
import { docOgImage, OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Program documentation";
export const revalidate = 3600;

export default async function Image({
  params,
}: {
  params: Promise<{ program: string }>;
}) {
  const { program } = await params;
  const content = await loadProgramContent(program);
  const home = content ? findDoc(content, []) : null;
  return docOgImage(program, {
    title: content?.config.title ?? `${program} docs`,
    description: home?.description ?? content?.config.tagline ?? null,
    path: `/${program}`,
  });
}
