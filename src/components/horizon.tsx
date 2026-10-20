/**
 * Where the sky stops and the paper starts. Drawn rather than ruled, the way
 * the CloudFALL site does it: the identity is hand-lettered, so the one
 * structural edge on the page is allowed a wobble. The path is the site's own
 * (AD-Archer/cloudFALL, src/lib/Horizon.svelte) and is credited on /credits.
 *
 * Fills with currentColor, so the parent says what the ground below it is.
 * `flip` turns it over, for the horizon the paper makes running back into
 * the sky at the foot of the page.
 */
export const HORIZON_PATH =
  "M0 40 V23 C60 15 120 27 190 21 S320 9 400 19 S520 31 610 21 S740 7 830 17 S960 29 1050 19 S1150 11 1200 21 V40 Z";

export function Horizon({
  flip = false,
  className = "",
}: {
  flip?: boolean;
  className?: string;
}) {
  return (
    <svg
      className={["horizon", flip ? "horizon--flip" : "", className]
        .filter(Boolean)
        .join(" ")}
      viewBox="0 0 1200 40"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path fill="currentColor" d={HORIZON_PATH} />
    </svg>
  );
}
