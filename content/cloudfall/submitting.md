---
title: Submitting your project
description: Read this before you submit please.
group: ship
order: 2
related:
  - review
  - packaging
  - devlogs-and-hours
---

Submissions go through the program's own pages on stern. The join button in the
header leads there. This page is what to have ready before you start filling that form in.

## The checklist

- **It replaces something proprietary.** Name the subscription or paid product in
  your project description.
- **It's new.** Built during this round. You can't resubmit a project, or the
  hours behind it, from another YSWS. NO DOUBLE DIPPING
- **Hours are tracked.** In Hackatime or Lapse, on the project you're submitting.
- **It's open.** Public GitHub repo, permissive licence, README with images, and
  it stays up permanently.
- **It runs.** A live link a reviewer can open. Self-hosted only? Then a repo and
  a Docker container see [Package it so it runs](/cloudfall/packaging).
- **It's yours.** Not a tutorial followed step for step, not someone else's
  project with the colours changed. At most 30% AI-assisted. If you built a tutorial please reach out in the slack for advice on how to make it yours.

## Before you submit, in this order

1. **Clone it fresh and start it.** `/tmp`, no cached env, no local database.
   This catches the uncommitted file.
2. **Open your own live link** in a private window.
3. **Read your README as a stranger.** Does it say what this replaces, in the
   first sentence?
4. **Check your Hackatime total** against the project you're about to submit.
5. **Check the licence file exists.** Not "MIT" in the README an actual
   `LICENSE` file.
6. **Check the header.** If it says the round is closed, submissions aren't
   being accepted; ask in the channel about the next one.

## What happens next

A reviewer opens your links and runs down [the same checks](/cloudfall/review).
If something's missing, it comes back with notes, and fixing and
resubmitting is expected, not a strike against you.

> [!TIP]
> Submit before the last day. A submission that comes back with notes on the
> final afternoon leaves you no time to fix it; the same notes a week out cost
> you an hour.
