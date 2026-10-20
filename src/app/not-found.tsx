import Link from "next/link";
import { Mascot } from "@/components/mascot";
import { loadProgramContent } from "@/lib/content";
import { DEFAULT_PROGRAM } from "@/lib/site";

/**
 * Outside any program's layout, so it borrows the default program's mascot
 * when there is one: a dead link is the one place a reader meets the site
 * without its program, and he makes it feel like a wrong turn rather than a
 * wall.
 */
export default async function NotFound() {
  const content = await loadProgramContent(DEFAULT_PROGRAM);
  const icon = content?.config.brand?.icon ?? null;

  return (
    <div className="empty-state">
      {icon ? <Mascot src={icon} pose="lean" size={150} flip /> : null}
      <p className="silkscreen">No such port</p>
      <h1 className="display empty-state__title">This page isn&apos;t here</h1>
      <p>
        It may have been renamed, or the link may be from an older version of the
        docs. The contents list has everything that exists right now.
      </p>
      <Link className="btn btn-primary" href={`/${DEFAULT_PROGRAM}`}>
        Go to the docs home
      </Link>
    </div>
  );
}
