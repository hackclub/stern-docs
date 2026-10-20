---
title: What reviewers check
description: I don't have a creative thing to put here, maybe you submit a pull request
group: ship
order: 3
related:
  - submitting
  - packaging
---

Six checks, every submission. Miss one and it comes back with notes; fix it and
resubmit. Nothing here is a judgement call about whether your project is
impressive these are the things that are either true or not.

## Replaces something proprietary

It stands in for something people pay for, or something closed you'd rather have
open. **Name it in your project description.**

Hardware counts, as long as it's beneficial to a homelab or on-prem setup even
indirectly. An antenna that pulls in public radio channels and streams them is a
CloudFALL project, but a generic aliexpress antenna in a jellyfin lab is not. Hardware should come from you.

## Built new, during this round

No resubmitting a project from another YSWS. A
project you started earlier can inspire this one; it can't _be_ this one.

## Hours tracked

Every hour in Hackatime/Lapse, linked to the project you submit. Untracked time can't
be counted, and at most 30% of the work can be AI-assisted.

## Open source, permanently

- Public GitHub repo.
- A permissive licence, as a `LICENSE` file.
- A README with images.
- It stays up. Deleting the repo after review is not how this works.

## It runs

A live link a reviewer can open and use. If it's self-hosted only, ship a repo
and a Docker container so the reviewer can start it themselves. See
[Package it so it runs](/cloudfall/packaging).

## It's your own work

Not a tutorial followed step for step. Not somebody else's project with the
colours changed. Using libraries, base images and other people's Compose files is
normal engineering passing off someone else's project as yours is not. But something only you can build/only you want.

## If it comes back

You'll get notes naming the specific check that failed. Fix that thing and
resubmit; there's no penalty for a resubmission. If the notes don't make sense,
ask in **#ysws-CloudFALL** reviewers are in there, and "I don't understand this
note" is a completely reasonable message.
