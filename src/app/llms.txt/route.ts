import { listPrograms } from "@/lib/content";
import { buildIndex, NOINDEX_HEADERS } from "@/lib/llms";

/**
 * `/llms.txt`  the llmstxt.org-shaped index of everything here.
 *
 * At the site root because that's where agents and crawlers look for it, the same
 * way they look for /robots.txt.
 */
export const revalidate = 300;

export async function GET() {
  const body = await buildIndex(await listPrograms(), Date.now());
  return new Response(body, { headers: NOINDEX_HEADERS });
}
