import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { HORIZON_PATH } from "@/components/horizon";
import { loadProgramContent, programName, type DocsConfig } from "@/lib/content";
import { fetchProgram, type Program } from "@/lib/program";
import {
  archiveDate,
  describeSchedule,
  parseDate,
  shortDate,
} from "@/lib/schedule";
import { resolveThemeSeed } from "@/lib/seed";
import { ogColors } from "@/lib/theme";
import { HACK_CLUB_FLAG, SITE_URL } from "@/lib/site";

export const OG_SIZE = { width: 1200, height: 630 };

const ROOT = process.cwd();
const FONT_DIR = path.join(ROOT, "src", "assets", "fonts");

/**
 * The same three Plex voices the page uses, read once per server the way the
 * Next docs do it. satori can't load from Google Fonts, and a share card in a
 * different typeface than the page it links to reads as somebody else's poster.
 */
const [condensed, mono, sans, flagSvg] = await Promise.all([
  readFile(path.join(FONT_DIR, "IBMPlexSansCondensed-SemiBold.woff")),
  readFile(path.join(FONT_DIR, "IBMPlexMono-Medium.woff")),
  readFile(path.join(FONT_DIR, "IBMPlexSans-Regular.woff")),
  readFile(path.join(ROOT, "public", HACK_CLUB_FLAG)),
]);

const FONTS = [
  { name: "Plex Condensed", data: condensed, weight: 600 as const, style: "normal" as const },
  { name: "Plex Mono", data: mono, weight: 500 as const, style: "normal" as const },
  { name: "Plex Sans", data: sans, weight: 400 as const, style: "normal" as const },
];

const FLAG_SRC = `data:image/svg+xml;base64,${flagSvg.toString("base64")}`;

/** The drawn horizon as an image, in the colour of the paper under the sky. */
const horizonSrc = (fill: string) =>
  `data:image/svg+xml;base64,${Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 40" preserveAspectRatio="none"><path fill="${fill}" d="${HORIZON_PATH}"/></svg>`,
  ).toString("base64")}`;

/**
 * A mark from public/, inlined. The card is rendered on the server, often at
 * build time, where a URL back to this very site isn't reachable yet  so the
 * file is read from disk and handed to satori as a data URI.
 */
async function localImage(publicPath: string | undefined): Promise<string | null> {
  if (!publicPath || !publicPath.startsWith("/") || publicPath.includes("..")) {
    return null;
  }
  try {
    const data = await readFile(path.join(ROOT, "public", publicPath));
    const type = publicPath.endsWith(".svg")
      ? "image/svg+xml"
      : publicPath.endsWith(".jpg") || publicPath.endsWith(".jpeg")
        ? "image/jpeg"
        : "image/png";
    return `data:${type};base64,${data.toString("base64")}`;
  } catch {
    return null;
  }
}

/**
 * The round, in words a cached card can't be wrong about. An open round says
 * when it closes, a finished one says it's an archive, and an unreachable stern
 * says nothing at all  a card in Slack's image proxy may be days old, so it
 * never carries a countdown, and it never claims a status it didn't read.
 */
function statusLine(data: Program | null): { text: string; live: boolean } | null {
  if (!data) return null;
  const start = parseDate(data.startsAt);
  const end = parseDate(data.endsAt);
  const schedule = describeSchedule(start, end, Date.now());

  if (schedule.phase === "ended") {
    const ran = [start ? shortDate(start) : null, end ? archiveDate(end) : null]
      .filter(Boolean)
      .join(" – ");
    return { text: `Archive${ran ? ` · ran ${ran}` : ""}`, live: false };
  }
  if (schedule.phase === "upcoming") {
    return { text: `Opens ${start ? shortDate(start) : "soon"}`, live: false };
  }
  return { text: end ? `Open · closes ${shortDate(end)}` : "Open", live: true };
}

export type OgCard = {
  title: string;
  description?: string | null;
  /** The section the page sits in, for the eyebrow. */
  section?: string | null;
  /** Reserved: the page path. Not drawn, see the corner note below. */
  path?: string;
};

/**
 * The share card: the docs home in miniature. A band of sky carrying the flag
 * and the program's wordmark, a drawn horizon, and the page's title on the
 * paper below  so a link dropped in Slack looks like the thing it opens.
 */
export async function docOgImage(program: string, card: OgCard) {
  const content = await loadProgramContent(program);
  const config: DocsConfig = content?.config ?? { title: "Docs", groups: [] };
  const data = await fetchProgram(program);
  const seed = await resolveThemeSeed(data, config);
  const c = ogColors(seed);

  const name = data?.name ?? programName(config);
  const status = statusLine(data);
  const wordmark = await localImage(config.brand?.wordmark);
  const icon = await localImage(config.brand?.icon);
  // stern's logo is a URL satori fetches itself; the local mark needs no network.
  const mark = wordmark ?? data?.images.logo ?? icon;
  const markIsWide = Boolean(wordmark);

  // The wordmark already says whose docs these are; the eyebrow says where in
  // them. Without a local wordmark the program name has to carry that itself.
  const eyebrow = wordmark ? (card.section ?? "") : `${name} docs`;
  const title = card.title;
  const titleSize = title.length > 44 ? 60 : title.length > 28 ? 72 : 84;
  const host = SITE_URL.replace(/^https?:\/\//, "");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: c.background,
          fontFamily: "Plex Sans",
          position: "relative",
        }}
      >
        {/* The sky, with the brand seam along its top edge like the site. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 232,
            padding: "0 72px 24px",
            background: c.sky,
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 10,
              background: `linear-gradient(90deg, ${c.brand} 0%, ${c.brand2} 60%, ${c.sky} 100%)`,
            }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={FLAG_SRC} alt="" width={150} height={52} />
          {mark ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mark}
              alt=""
              width={markIsWide ? 360 : 96}
              height={markIsWide ? 135 : 96}
              style={{ objectFit: "contain" }}
            />
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={horizonSrc(c.background)}
            alt=""
            width={1200}
            height={36}
            style={{ position: "absolute", left: 0, bottom: -1 }}
          />
        </div>

        {/* The paper. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flexGrow: 1,
            padding: "28px 72px 48px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            {eyebrow ? (
              <div
                style={{
                  fontFamily: "Plex Mono",
                  color: c.muted,
                  fontSize: 21,
                  letterSpacing: 5,
                  textTransform: "uppercase",
                  marginBottom: 14,
                }}
              >
                {eyebrow}
              </div>
            ) : null}
            <div
              style={{
                display: "flex",
                fontFamily: "Plex Condensed",
                fontSize: titleSize,
                lineHeight: 1.02,
                color: c.foreground,
                fontWeight: 600,
                letterSpacing: -1.5,
                maxWidth: 1000,
              }}
            >
              {title}
            </div>
            {card.description ? (
              <div
                style={{
                  display: "flex",
                  marginTop: 18,
                  fontSize: 27,
                  lineHeight: 1.35,
                  color: c.muted,
                  maxWidth: 940,
                }}
              >
                {card.description.length > 150
                  ? `${card.description.slice(0, 147).trimEnd()}…`
                  : card.description}
              </div>
            ) : null}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontFamily: "Plex Mono",
              fontSize: 21,
              letterSpacing: 3,
              textTransform: "uppercase",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", color: c.brand }}>
              {status ? (
                <>
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 7,
                      background: status.live ? c.brand : c.hairline,
                      boxShadow: status.live ? `0 0 0 5px ${c.brand}33` : "none",
                      marginRight: 16,
                    }}
                  />
                  {status.text}
                </>
              ) : null}
            </div>
            {/* The docs home, not the page path: a long slug wraps into the
                status line. One string, not two text nodes, because satori wants
                explicit flex for anything with more than one child. */}
            <div style={{ color: c.muted, flexShrink: 0, marginLeft: 32 }}>
              {`${host}/${program}`}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: FONTS },
  );
}
