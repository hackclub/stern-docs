---
title: "Jellyfin"
description: "Jellyfin is a free and open-source media server and suite of multimedia applications designed to organize, manage, and share digital media files to networked devices."
group: watch
order: 1
tags: [movies, tv, media-server]
related:
  - guides/ripping-dvds
  - guides/hardlinks
  - guides/navidrome
  - pick-a-project
synced: "2026-10-20"
sources:
  - label: "Wikipedia, \"Jellyfin\""
    href: "https://en.wikipedia.org/w/index.php?title=Jellyfin&oldid=1376506673"
    author: "Wikipedia contributors, CC BY-SA 4.0"
    note: "Lead copied verbatim. Revision of 2026-09-24."
  - label: "Jellyfin documentation, \"Quick Start\""
    href: "https://jellyfin.org/docs/general/quick-start"
    author: "Jellyfin contributors, CC BY-ND 4.0"
    note: "Sections copied whole and unchanged, as the licence requires; only relative links were made absolute, site components removed and headings nested. Upstream commit 915333d."
  - label: "Jellyfin documentation, \"Container\""
    href: "https://jellyfin.org/docs/general/installation/container"
    author: "Jellyfin contributors, CC BY-ND 4.0"
    note: "Sections copied whole and unchanged, as the licence requires; only relative links were made absolute, site components removed and headings nested. Upstream commit 915333d."
  - label: "Jellyfin documentation, \"Movies\""
    href: "https://jellyfin.org/docs/general/server/media/movies"
    author: "Jellyfin contributors, CC BY-ND 4.0"
    note: "Sections copied whole and unchanged, as the licence requires; only relative links were made absolute, site components removed and headings nested. Upstream commit 915333d."
  - label: "Jellyfin documentation, \"TV Shows\""
    href: "https://jellyfin.org/docs/general/server/media/shows"
    author: "Jellyfin contributors, CC BY-ND 4.0"
    note: "Sections copied whole and unchanged, as the licence requires; only relative links were made absolute, site components removed and headings nested. Upstream commit 915333d."
---

Jellyfin is a free and open-source media server and suite of multimedia applications designed to organize, manage, and share digital media files to networked devices. Jellyfin consists of a server application installed on a machine running Linux, Microsoft Windows, or macOS; and another application running on a client device such as a smartphone, tablet, smart TV, streaming media player, game console or in a web browser. Jellyfin also can serve media to DLNA and Chromecast-enabled devices. It is a fork of Emby.

## Quick Start

Welcome to the Jellyfin quick start guide!
Jellyfin is a powerful open-source media server that lets you organize, stream, and access your personal media collection—from movies and TV shows to music and photos—on any device.
To get started, you'll need to set up the server application, which acts as the central hub for serving your media.
This guide will give a quick overview of the steps required to install and configure Jellyfin to get your media server up and running.

### Get started

1. [Install and launch Jellyfin](https://jellyfin.org/docs/general/installation) on the computer that will be your media server.
2. [Complete the setup wizard](https://jellyfin.org/docs/general/post-install/setup-wizard) to create an admin account, add media, and adjust settings.
3. Enjoy your media!

#### (Optional) Extra credit

- [Install mobile, tv, or desktop clients.](https://jellyfin.org/downloads)
- [Configure remote access.](https://jellyfin.org/docs/general/post-install/networking/#external-access)

## Container

### Installation Instructions

> [!WARNING]
> If you wish to use [Windows](https://jellyfin.org/docs/general/installation/windows) or [macOS](https://jellyfin.org/docs/general/installation/macos), please install Jellyfin natively instead.
>
> While it is possible to run Jellyfin in a Container on a Windows or macOS host, it is NOT supported. Some features are known to be broken when running in a Container on platforms other than Linux, Notably:
>
> - Hardware Accelerated Transcoding
> - [Scanning on macOS in Docker](https://github.com/jellyfin/jellyfin/issues/13093)
>
> You WILL NOT receive any support for running Jellyfin in a Container on platforms other than Linux.

Create a `docker-compose.yml` file like the following.

```yml
services:
  jellyfin:
    image: jellyfin/jellyfin
    container_name: jellyfin
    # Optional - specify the uid and gid you would like Jellyfin to use instead of root
    user: uid:gid
    ports:
      - 8096:8096/tcp
      - 7359:7359/udp
    volumes:
      - /path/to/config:/config
      - /path/to/cache:/cache
      - type: bind
        source: /path/to/media
        target: /media
      - type: bind
        source: /path/to/media2
        target: /media2
        read_only: true
      # Optional - extra fonts to be used during transcoding with subtitle burn-in
      - type: bind
        source: /path/to/fonts
        target: /usr/local/share/fonts/custom
        read_only: true
    restart: 'unless-stopped'
    # Optional - alternative address used for autodiscovery
    environment:
      - JELLYFIN_PublishedServerUrl=http://example.com
    # Optional - may be necessary for docker healthcheck to pass if running in host network mode
    extra_hosts:
      - 'host.docker.internal:host-gateway'
```

Then while in the same folder as the `docker-compose.yml` run:

```sh
docker compose up
```

To run the container in background add `-d` to the above command.

You can learn more about using Docker by [reading the official Docker documentation](https://docs.docker.com/).

## Movies

Movies can be added to a Jellyfin server using the "Movies" library type.

### Organization

Movies should be organized into individual folders for each movie. The folder can optionally contain extra files.

```txt
Movies
├── Best_Movie_Ever (2019)
│   ├── Best_Movie_Ever (2019).mp4
│   ├── Best_Movie_Ever (2019).nfo
│   ├── Best_Movie_Ever (2019).en_us.srt
│   ├── cover.png
│   └── theme.mp3
└── Movie (2021) [imdbid-tt12801262]
    ├── backdrop.jpg
    └── VIDEO_TS
        ├── VIDEO_TS.BUP
        ├── VIDEO_TS.IFO
        ├── VIDEO_TS.VOB
        ├── VTS_01_0.BUP
        ├── VTS_01_0.IFO
        ├── VTS_01_0.VOB
        ├── VTS_01_1.VOB
        └── VTS_01_2.VOB
```

### Naming

The folder containing the movie should be named in the following format:

```txt
Movie Name (year) [metadata provider id]
```

The `year` and `metadata provider id` fields are optional, but they will help identify media more reliably.

The video files within the folder should have the same name as the folder. I.e. if the folder is named `Super Fun Movie`, the video file within should be named `Super Fun Movie.mp4` (or any other extension), optionally with tags defined below.

- Example with name only: `Jellyfin Documentary.mkv`
- Example with year: `Jellyfin Documentary (2030).mkv`
- Example with metadata provider id: `Jellyfin Documentary [imdbid-tt00000000].mkv`
- Example with both year and metadata provider id: `Jellyfin Documentary (2030) [imdbid-tt00000000].mkv`

## TV Shows

TV Shows can be added to Jellyfin using the "Shows" library type.

### Organization

Shows should be organized into series folders, then into season folders under each series.

```txt
Shows
├── Series Name A (2010)
│   ├── Season 00
│   │   ├── Some Special.mkv
│   │   ├── Series Name A S00E01.mkv
│   │   └── Series Name A S00E02.mkv
│   ├── Season 01
│   │   ├── Series Name A S01E01-E02.mkv
│   │   ├── Series Name A S01E03.mkv
│   │   └── Series Name A S01E04.mkv
│   └── Season 02
│       ├── Series Name A S02E01.mkv
│       ├── Series Name A S02E02.mkv
│       ├── Series Name A S02E03 Part 1.mkv
│       └── Series Name A S02E03 Part 2.mkv
└── Series Name B (2018)
    ├── Season 01
    |   ├── Series Name B S01E01.mkv
    |   └── Series Name B S01E02.mkv
    └── Season 02
        ├── Series Name B S02E01-E02.mkv
        └── Series Name B S02E03.mkv
```

Each video file may contain multiple episodes. However, they will be shown as a single entry containing metadata from multiple episodes. It is recommended that the video files be split into individual episodes using a tool like [MKVToolNix](https://mkvtoolnix.download)

### Naming

The series folder should be named in the following format:

```txt
Series Name (year) [metadata provider id]
```

The `year` and `metadata provider id` fields are optional, but they will help identify media more reliably.

- Example with name only: `Jellyfin Documentary.mkv`
- Example with year: `Jellyfin Documentary (2030)`
- Example with metadata provider id: `Jellyfin Documentary [imdbid-tt00000000]`
- Example with both year and metadata provider id: `Jellyfin Documentary (2030) [imdbid-tt00000000]`

The Season folders should be named `Season *`, with `*` being any number. Do not abbreviate the `Season` name to `S01` or `SE01`. For the best results, please pad the season number with `0`s at the front to make sure each entry has the same number of digits. For example: `Season 5` -> `Season 05`. Also do not mix Season folders with episodes in the Shows folder.
