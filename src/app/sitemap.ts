import type { MetadataRoute } from "next";
import { listPrograms, loadProgramContent } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

/** Every doc page, so a shared link is also a findable one. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const programs = await listPrograms();
  const entries = await Promise.all(
    programs.map(async (program) => {
      const content = await loadProgramContent(program);
      return (content?.docs ?? [])
        .filter((doc) => !doc.hidden)
        .map((doc) => ({
          url: `${SITE_URL}${doc.href}`,
          changeFrequency: "weekly" as const,
          priority: doc.segments.length === 0 ? 1 : 0.7,
        }));
    }),
  );
  return [
    ...entries.flat(),
    {
      url: `${SITE_URL}/embed`,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    },
  ];
}
