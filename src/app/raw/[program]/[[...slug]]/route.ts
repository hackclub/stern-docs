import { findDoc, loadProgramContent } from "@/lib/content";
import { creditLines, MARKDOWN_HEADERS } from "@/lib/llms";
import { SITE_URL } from "@/lib/site";

/**
 * One page's markdown, exactly as it sits on disk, with a short provenance header.
 *
 * `/raw/cloudfall` is the home page; `/raw/cloudfall/faq` is the FAQ. This is what
 * the "Copy as Markdown" button links to, what `/llms.txt` points every entry at,
 * and the honest answer to "can I just read the source of this page".
 *
 * An optional segment catch-all (`[[...slug]]`) rather than two routes, so the
 * program index and its pages share one implementation.
 */
export const revalidate = 300;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ program: string; slug?: string[] }> },
) {
  const { program, slug } = await params;
  const content = await loadProgramContent(program);
  if (!content) {
    return new Response(`No program named "${program}".\n`, {
      status: 404,
      headers: MARKDOWN_HEADERS,
    });
  }

  const doc = findDoc(content, slug ?? []);
  if (!doc) {
    return new Response(
      `No page at "${(slug ?? []).join("/")}" in ${program}. Index: ${SITE_URL}/llms.txt\n`,
      { status: 404, headers: MARKDOWN_HEADERS },
    );
  }

  // Frontmatter is stripped by the content layer, so the title and description
  // are re-stated here as a comment  the body alone doesn't say what it is.
  const header = [
    `<!--`,
    `${doc.title}${doc.description ? `  ${doc.description}` : ""}`,
    `Page: ${SITE_URL}${doc.href}`,
    `Source: ${doc.filePath}`,
    ...creditLines(doc, content),
    `-->`,
    "",
  ].join("\n");

  // The HTML page is the one to index; this is its source. A Link header is
  // the only way a text response can say so.
  return new Response(`${header}${doc.body}\n`, {
    headers: {
      ...MARKDOWN_HEADERS,
      Link: `<${SITE_URL}${doc.href}>; rel="canonical"`,
    },
  });
}
