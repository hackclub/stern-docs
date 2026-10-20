---
title: Pick a project
description: Find something you pay for and build a replacement
group: start
order: 2
tags: [ideas, movies, music, photos, files, games]
related:
  - what-you-pay-for
  - guides/jellyfin
  - guides/navidrome
  - guides/immich
  - guides/syncthing
  - guides/minecraft-server
---

The strongest CloudFALL submissions will start with something specific: a service, a
price, a month. For example "The $17.99 I pay Netflix, but I have dvds at home" is a project waiting to happen.

## Things people rent, and what runs instead

| You pay for   | Runs instead | Port | What you actually get                                                                                     |
| ------------- | ------------ | ---- | --------------------------------------------------------------------------------------------------------- |
| Netflix       | [Jellyfin](/cloudfall/guides/jellyfin)     | 8096 | Rip the discs you own, stream them to every screen in the house like netflix.                             |
| Spotify       | [Navidrome](/cloudfall/guides/navidrome)    | 4533 | High quality music for free, with no ads that you own forever.                                            |
| Google Photos | [Immich](/cloudfall/guides/immich)       | 2283 | Automated backups for all of your photos but you don't owe google $25/M for the rest of time.             |
| iCloud+       | [Syncthing](/cloudfall/guides/syncthing)    | 8384 | Every photo and backup your phone makes on every device you own                                           |

That table is a starting point. The test is in
[what reviewers check](/cloudfall/review): does it replace something proprietary(privately owned)
that people pay for, and is it open source when you're done.

## Ways to make it yours

Installing Jellyfin isn't a project!!! somebody already built Jellyfin! Building
something _around_ the problem is:

- The **thing that's missing** from an existing tool. A phone app for the
  service you run. A migration tool that gets your data out of the paid thing.
- The **glue**. Something that watches a folder, tags what lands in it, and files
  it where three other services can find it.
- The **hardware end**. An antenna that pulls in radio and streams it to your
  network. A sensor that logs something the paid app charges you to see.
- The **subscription nobody has replaced yet**. Gym trackers, recipe apps,
  language courses, parking apps. Look at the last three things that charged
  your card.

> [!TIP]
> Ask in **#ysws-CloudFALL** before you commit a week to an idea. "Does this
> count?" gets answered in minutes, and the answer sometimes makes the project
> better rather than smaller.

## Hardware projects

Hardware is in scope as long as it's useful to a homelab or on-prem setup, even
somewhat indirectly the antenna example above is the canonical one. The same
rules apply: it has to be documented well enough that someone else could build
it, and open source means the schematics and firmware too, not just a photo of
the finished box, that also means tracking your time using [lapse](https://lapse.hackclub.com)

## Scoping it

Aim for something that runs end to end, then make it better. A working thing
with three features beats a beautiful thing that doesn't start. You can submit muliple times even if you change something and add a new feature so **don't be afraid to ship.**
