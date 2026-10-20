---
title: "Navidrome"
description: "Navidrome can be used as a standalone server, that allows you to browse and listen to your music collection using a web browser."
group: listen
order: 1
tags: [music]
related:
  - guides/jellyfin
  - pick-a-project
synced: "2026-10-20"
sources:
  - label: "Navidrome documentation, \"Navidrome Overview\""
    href: "https://www.navidrome.org/docs/overview/"
    author: "Navidrome contributors, Apache-2.0"
    note: "Copied verbatim; app catalog image removed, links made absolute. Upstream commit bf37b95."
  - label: "Navidrome documentation, \"Installing with Docker\""
    href: "https://www.navidrome.org/docs/installation/docker/"
    author: "Navidrome contributors, Apache-2.0"
    note: "Copied verbatim; links made absolute. Upstream commit bf37b95."
---

Navidrome can be used as a standalone server, that allows you to browse and listen to your music collection using a web browser.

It can also work as a lightweight Subsonic-API compatible server, that can be used with any
[Subsonic compatible client](https://www.navidrome.org/docs/overview/#apps).

## Features

- Very **low resource usage**. Runs well even on simple Raspberry Pi Zero and old hardware setups
- Handles very **large music collections**
- Streams virtually **any audio format** available
- Reads and uses all your beautifully curated **metadata**
- Great support for **compilations** (Various Artists albums) and **box sets** (multi-disc albums)
- **Multi-user**, each user has their own play counts, playlists, favorites, etc..
- **Multi-library** support with user-specific access controls to separate different music collections
- **Multi-platform**, runs on macOS, Linux and Windows. **Docker** images are also provided
- Ready to use, official, **Raspberry Pi** binaries and Docker images available
- Automatically **monitors your library** for changes, importing new files and reloading new metadata
- **Themeable**, modern and responsive **Web interface** based on [Material UI](https://material-ui.com) and [React-Admin](https://marmelab.com/react-admin/)
- **Compatible** with all Subsonic/Madsonic/Airsonic clients. See below for a list of tested clients
- **Transcoding** on the fly. Can be set per user/player. **Opus encoding is supported**
- Translated to **34 languages** ([and counting](https://www.navidrome.org/docs/developers/translations/))
- Full support for **playlists**, with option to auto-import `.m3u` files and to keep them in sync
- **Smart**/dynamic playlists (similar to iTunes). More info [here](https://github.com/navidrome/navidrome/issues/1417)
- Scrobbling to **Last.fm**, **ListenBrainz** and **Maloja** (via custom ListenBrainz URL)
- **Sharing** public links to albums/songs/playlists
- **Externalized authentication** to use your own authentication service instead of Navidrome's built-in one
- [Jukebox mode](https://www.navidrome.org/docs/usage/features/jukebox) allows playing music on an audio device attached to the server, and control from a client

> [!NOTE]
> Navidrome [**does not support**](https://www.navidrome.org/docs/faq/#-can-you-add-a-browsing-by-folder-optionmode-to-navidrome)
> browsing by folders, but simulates it based on the tags with a structure like:
> `/AlbumArtist/Album/01-Song.ext`

## Installing with Docker

[Docker images](https://hub.docker.com/r/navidrome/navidrome) are available for the
_linux/amd64_, _linux/arm/v6_, _linux/arm/v7_ and _linux/arm64_ platforms. They include everything needed to
run Navidrome.

### Using `docker-compose` :

Create a `docker-compose.yml` file with the following content (or add the `navidrome` service
below to your existing file):

```yaml
services:
  navidrome:
    image: navidrome/navidrome:latest
    user: 1000:1000 # must own the data folder and be able to read music folder(s). See Permissions below
    ports:
      - "4533:4533"
    restart: unless-stopped
    environment:
      # Optional: put your config options customization here. Examples:
      # ND_LOGLEVEL: debug
    volumes:
      - "/path/to/data:/data"
      - "/path/to/your/music/folder:/music:ro"
```

Start it with `docker-compose up -d`. Note that the environment variables above are just an example and are not required. The
values in the example are already the defaults

### Using `docker` command line tool:

```shell
$ docker run -d \
   --name navidrome \
   --restart=unless-stopped \
   --user $(id -u):$(id -g) \
   -v /path/to/music:/music \
   -v /path/to/data:/data \
   -p 4533:4533 \
   -e ND_LOGLEVEL=info \
   navidrome/navidrome:latest
```

### Permissions

The configurations above are examples. The IDs in them will not always match your machine, so adjust
them before you start the container.

Navidrome needs:

- read **and write** access to `/data`, where it creates its database and cache
- read access to `/music`

Both must be granted to the `UID:GID` you put in the `user` directive. Run `id -u` and `id -g` to see the
IDs of your own account, and `ls -n /path/to/your/music/folder` to see which IDs own your music. Whatever
numbers you pick, use the same ones in the `user` directive and in the commands below.

The two folders fail in different ways, so the logs tell you which one is wrong.

#### The data folder is not writable

Navidrome cannot create its database, and the container stops at startup:

```
level=error msg="Error applying PRAGMA optimize" error="unable to open database file: no such file or directory"
panic: runtime error: invalid memory address or nil pointer dereference
```

Create the data folder and give it to the same user you run the container as:

```shell
mkdir -p /path/to/data
sudo chown -R $(id -u):$(id -g) /path/to/data
```

#### The music folder is not readable

Navidrome starts and the web interface works, but your library stays empty. The logs show:

```
level=error msg="Error starting watcher" error="open /music: permission denied" lib=/music/...
level=warning msg="Scanner: Target folder does not exist." error="open .: permission denied" path=.
```

The folder does exist, despite what the second message says. The container user just cannot open it.
Give that user read and execute access, either by changing the owner:

```shell
sudo chown -R $(id -u):$(id -g) /path/to/your/music/folder
```

or, if other programs also use the folder, by opening it for reading:

```shell
sudo chmod -R a+rX /path/to/your/music/folder
```

Two things people often try that do not work:

- **`PUID` and `PGID` have no effect.** Those variables are a [linuxserver.io](https://docs.linuxserver.io/general/understanding-puid-and-pgid/)
  convention. Navidrome's image ignores them. Use the `user` directive instead.
- **Removing the `user` directive is not a fix.** The container then runs as `root`, which can write
  anywhere, so the error goes away. **Do not do this in production.** Fix the folder ownership instead.

### Customization

- The `user` argument should reflect the `UID:GID` that owns the data folder and can read the music library. See [Permissions](#permissions) above.
- Remember to change the `volumes` paths to point to your local paths. `/data` is where Navidrome
  will store its DB and cache, `/music` is where your music files are stored. For [multi-library setups](https://www.navidrome.org/docs/usage/features/multi-library/), you may need to mount additional volumes for each library.
- [Configuration options](https://www.navidrome.org/docs/usage/configuration/options/) can be customized with environment
  variables as needed. For `docker-compose` just add them to the `environment` section or the yml
  file. For `docker` cli use the `-e` parameter. Ex: `-e ND_SESSIONTIMEOUT=24h`.
- If you want to use a [configuration file](https://www.navidrome.org/docs/usage/configuration/options/#configuration-file) with Navidrome running in Docker,
  you can create a `navidrome.toml` config file in the `/data` folder and set the option `ND_CONFIGFILE=/data/navidrome.toml`.
- If you use the [Jellyfin API](https://www.navidrome.org/docs/usage/features/jellyfin/) and want clients to find the server on your network,
  you must use host networking. See [Docker setup for auto-discovery](https://www.navidrome.org/docs/usage/features/jellyfin/#docker).
