import Image from "next/image";

export type MascotPose = "idle" | "lean" | "peek";

/**
 * A program's mascot, from the PNG in docs.json `brand.icon` and nothing else:
 * he is a drawing, and a traced copy would be a different creature wearing his
 * colours. What changes per appearance is how he sits, not how he is drawn:
 *
 *   idle   upright
 *   lean   tipped toward whatever is beside him
 *   peek   tucked against an edge, tilted in from it
 *
 * Decorative everywhere: the page says everything he says, in words, next to
 * him, so he carries an empty alt and stays out of the accessibility tree.
 * The poses are the CloudFALL site's (AD-Archer/cloudFALL, src/lib/Linky.svelte),
 * credited on /credits. He never moves on his own.
 */
export function Mascot({
  src,
  pose = "idle",
  size = 160,
  flip = false,
  className = "",
}: {
  src: string;
  pose?: MascotPose;
  size?: number;
  flip?: boolean;
  className?: string;
}) {
  return (
    <Image
      src={src}
      alt=""
      aria-hidden
      width={size}
      height={size}
      className={["mascot", `mascot--${pose}`, flip ? "mascot--flip" : "", className]
        .filter(Boolean)
        .join(" ")}
      style={{ "--mascot-size": `${size}px` } as React.CSSProperties}
    />
  );
}
