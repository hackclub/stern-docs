import { listPrograms } from "@/lib/content";
import { buildFullText, NOINDEX_HEADERS, TEXT_HEADERS } from "@/lib/llms";

/**
 * `/llms-full.txt`  every page's markdown in one response, for pasting into a
 * model or handing to an agent that would otherwise crawl eleven URLs.
 *
 * `?program=<slug>` narrows it to one program, which is the common case: someone
 * asking questions about CloudFALL doesn't need Future's rules in the context
 * window alongside them.
 */
export const revalidate = 300;

export async function GET(request: Request) {
  const wanted = new URL(request.url).searchParams.get("program");
  const programs = await listPrograms();
  const scoped = wanted
    ? programs.filter((program) => program === wanted)
    : programs;

  if (wanted && scoped.length === 0) {
    return new Response(
      `No program named "${wanted}". Known programs: ${programs.join(", ")}\n`,
      { status: 404, headers: TEXT_HEADERS },
    );
  }

  const body = await buildFullText(scoped, Date.now());
  return new Response(body, { headers: NOINDEX_HEADERS });
}
