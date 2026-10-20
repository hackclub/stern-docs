import type { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocsShell } from "@/components/docs-shell";
import { EmbedBridge } from "@/components/embed-bridge";
import { Horizon } from "@/components/horizon";
import { Mascot } from "@/components/mascot";
import { Insight } from "@/components/insight";
import { JoinPanel } from "@/components/join-panel";
import { RoundStatus } from "@/components/round-status";
import {
  loadProgramContent,
  listPrograms,
  programName,
  type DocsConfig,
} from "@/lib/content";
import { plainText } from "@/lib/markdown";
import { fetchProgram, joinUrl, type Program } from "@/lib/program";
import { resolveThemeSeed } from "@/lib/seed";
import { authorOf, keywordsFor } from "@/lib/seo";
import { ogColors, themeCss } from "@/lib/theme";
import {
  CONTENT_REPO,
  CONTENT_REPO_URL,
  HACK_CLUB_FLAG,
  HACK_CLUB_FLAG_ORPHEUS,
  HACK_CLUB_URL,
  STERN_URL,
} from "@/lib/site";

/**
 * The shell every docs page sits in: theme tokens, the header, the patch panel,
 * the search index.
 *
 * Content comes from disk, liveness comes from stern's public API, and the two
 * are deliberately independent  if the API is unreachable the round status and
 * join panel simply aren't rendered, and the documentation is unaffected.
 */
export const revalidate = 300;

export async function generateStaticParams() {
  return (await listPrograms()).map((program) => ({ program }));
}

/** Where the program lives on stern: docs.json first, then the API, then the slug. */
function sternHome(config: DocsConfig, program: Program | null, slug: string) {
  return config.stern ?? program?.links.home ?? `${STERN_URL}/${slug}`;
}

/**
 * The tab icon is the program's own logo. A reader with the docs open in one tab
 * and the program in another should see the same mark on both. stern's logo is
 * preferred; the docs.json `brand.icon` is the fallback for when stern can't be
 * reached, so the tab never drops to the generic mark for a program that has one.
 *
 * Titles: the program layout owns the template, so a page only has to say its
 * own name and "· CloudFALL docs" is appended for it.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ program: string }>;
}): Promise<Metadata> {
  const { program } = await params;
  const content = await loadProgramContent(program);
  if (!content) return {};
  const data = await fetchProgram(program);
  const name = data?.name ?? programName(content.config);
  const icon = data?.images.logo ?? content.config.brand?.icon ?? null;
  const author = authorOf(content.config);

  return {
    title: { default: content.config.title, template: `%s · ${content.config.title}` },
    applicationName: content.config.title,
    keywords: keywordsFor(name, data?.projectTypes ?? []),
    authors: [{ name: author.name, url: author.url }],
    ...(icon
      ? {
          icons: {
            icon,
            // Apple wants a PNG; the local mascot is one, stern's logo may not be.
            ...(content.config.brand?.icon
              ? { apple: content.config.brand.icon }
              : {}),
          },
        }
      : {}),
    openGraph: { siteName: content.config.title, locale: "en_US" },
    twitter: { card: "summary_large_image" },
  };
}

/** The browser chrome wears the program's brand colour, like the page does. */
export async function generateViewport({
  params,
}: {
  params: Promise<{ program: string }>;
}): Promise<Viewport> {
  const { program } = await params;
  const content = await loadProgramContent(program);
  if (!content) return {};
  const seed = await resolveThemeSeed(await fetchProgram(program), content.config);
  return { themeColor: ogColors(seed).brand, colorScheme: "light" };
}

/** Keeps the client search payload to something sane on very long pages. */
const SEARCH_TEXT_LIMIT = 4000;

export default async function ProgramLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ program: string }>;
}) {
  const { program: slug } = await params;
  const content = await loadProgramContent(slug);
  if (!content) notFound();

  const program = await fetchProgram(slug);
  const seed = await resolveThemeSeed(program, content.config);
  const author = authorOf(content.config);

  // Read once and passed down, so the server HTML and the first client render
  // agree on what time it was (see components/use-schedule.ts).
  //
  // The purity lint exists to stop impure reads inside memoized client renders;
  // this is a server component rendered once per ISR revalidation, and the whole
  // point of the value is that it's a snapshot of when that render happened.
  // eslint-disable-next-line react-hooks/purity
  const renderedAt = Date.now();

  const homeHref = `/${slug}`;
  const name = program?.name ?? programName(content.config);
  const onStern = sternHome(content.config, program, slug);
  const join = {
    programName: name,
    startsAt: program?.startsAt ?? null,
    endsAt: program?.endsAt ?? null,
    joinUrl: joinUrl(program, slug),
    joinLabel: content.config.join?.label ?? `Join ${name}`,
    renderedAt,
  };

  // docs.json already lists the program's stern page when it has one; only add
  // the API's version when it doesn't, so the rail never shows it twice.
  const configured = new Set((content.config.links ?? []).map((link) => link.href));
  const links = [
    ...(content.config.links ?? []),
    ...(configured.has(onStern) ? [] : [{ label: `${name} on stern`, href: onStern }]),
  ];

  const siteHost = content.config.site
    ? new URL(content.config.site).host
    : null;

  return (
    <div className="shell">
      {/* Generated per program from its own artwork  see lib/seed.ts. */}
      <style dangerouslySetInnerHTML={{ __html: themeCss(seed) }} />
      <EmbedBridge />
      {/* Tags every event with the program whose docs are being read. */}
      <Insight program={slug} />

      {/* Header + contents rail + the page. The shell owns both because the
          header spans the viewport while the rail is a column inside it. */}
      <DocsShell
        title={content.config.title}
        tagline={content.config.tagline ?? program?.tagline ?? null}
        homeHref={homeHref}
        logo={program?.images.logo ?? null}
        flag={{ src: HACK_CLUB_FLAG_ORPHEUS, href: HACK_CLUB_URL }}
        groups={content.nav.map((group) => ({
          id: group.id,
          label: group.label,
          collapsed: group.collapsed === true,
          docs: group.docs.map((doc) => ({ href: doc.href, title: doc.title })),
        }))}
        links={links}
        search={content.docs
          .filter((doc) => !doc.hidden)
          .map((doc) => ({
            href: doc.href,
            title: doc.title,
            description: doc.description,
            group: doc.group,
            tags: doc.tags,
            text: plainText(doc.body).slice(0, SEARCH_TEXT_LIMIT),
          }))}
        status={
          program ? (
            <RoundStatus
              key="round-status"
              startsAt={join.startsAt}
              endsAt={join.endsAt}
              joinUrl={join.joinUrl}
              joinLabel={join.joinLabel}
              renderedAt={renderedAt}
            />
          ) : null
        }
        panel={
          program ? (
            // Keyed because it crosses the server→client boundary as a prop,
            // and React's dev key check treats that element as a list child.
            <JoinPanel
              key="join-panel"
              {...join}
              blurb={content.config.join?.blurb ?? program.description}
              hoursShipped={program.hoursShipped}
              slackChannel={program.slackChannel}
              format={program.format}
              projectTypes={program.projectTypes}
            />
          ) : null
        }
      >
        {children}
      </DocsShell>

      {/* A program with its own marks gets the site's closer: the paper runs
          back into the sky over a drawn horizon, and the mascot peeks over
          the bottom edge. Everyone else gets the plain ruled footer. */}
      <footer
        className={
          content.config.brand
            ? "site-foot site-foot--sky site-only"
            : "site-foot site-only"
        }
      >
        {content.config.brand ? (
          <Horizon flip className="site-foot__horizon" />
        ) : null}
        <div className="site-foot__inner">
          {/* Whose program this is. The flag is the official mark, unmodified. */}
          <div className="site-foot__col">
            <a href={HACK_CLUB_URL} target="_blank" rel="noreferrer">
              <Image
                className="site-foot__flag"
                src={HACK_CLUB_FLAG}
                alt="Hack Club"
                width={526}
                height={184}
                unoptimized
              />
            </a>
            <p className="site-foot__text">
              A{" "}
              <a href={HACK_CLUB_URL} target="_blank" rel="noreferrer">
                Hack Club
              </a>{" "}
              program.
            </p>
            {content.config.brand?.credit ? (
              <p className="site-foot__text">
                {content.config.brand.credit.href ? (
                  <a
                    href={content.config.brand.credit.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {content.config.brand.credit.label}
                  </a>
                ) : (
                  content.config.brand.credit.label
                )}
                .
              </p>
            ) : null}
          </div>

          {/* Where the program itself lives. */}
          <div className="site-foot__col">
            <h3 className="silkscreen site-foot__label">Runs on stern</h3>
            <ul>
              <li>
                <a href={onStern} target="_blank" rel="noreferrer">
                  {name} on stern
                </a>
              </li>
              <li>
                <a href={STERN_URL} target="_blank" rel="noreferrer">
                  {new URL(STERN_URL).host}
                </a>
              </li>
              {content.config.site && siteHost ? (
                <li>
                  <a href={content.config.site} target="_blank" rel="noreferrer">
                    {siteHost}
                  </a>
                </li>
              ) : null}
            </ul>
          </div>

          {/* Who made the docs, and where to change them. Not .silkscreen on the
              values  that uppercases, which mangles a repo path and is the wrong
              way to write a name. */}
          <div className="site-foot__col">
            <h3 className="silkscreen site-foot__label">These docs</h3>
            <ul>
              <li>
                Created by{" "}
                <a href={author.url} target="_blank" rel="noreferrer">
                  {author.name}
                </a>
              </li>
              <li>
                Edit on{" "}
                <a
                  className="tabular"
                  href={CONTENT_REPO_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  {CONTENT_REPO}
                </a>
              </li>
              <li>
                <Link href="/embed">Embed these docs</Link>
              </li>
              <li>
                <a href="/llms.txt">Plain-text index for agents</a>
              </li>
            </ul>
          </div>
        </div>
        {content.config.brand?.icon ? (
          <Mascot
            className="site-foot__mascot"
            src={content.config.brand.icon}
            pose="peek"
            size={132}
          />
        ) : null}
      </footer>
    </div>
  );
}
