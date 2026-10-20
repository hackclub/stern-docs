---
title: "Tube Archivist"
description: "Home of the documentation, additional installation instructions and user guide. Recommended reading for all interested in the project."
group: watch
order: 3
tags: [youtube, video]
related:
  - guides/jellyfin
  - guides/how-compose-works
synced: "2026-10-20"
sources:
  - label: "Tube Archivist Docs, home page"
    href: "https://docs.tubearchivist.com/"
    author: "Tube Archivist contributors, GPL-3.0"
    note: "Welcome line and Getting Started list copied verbatim; icons removed. Upstream commit bb7ee4d."
  - label: "Tube Archivist Docs, \"Setting up Tube Archivist with Docker\""
    href: "https://docs.tubearchivist.com/installation/docker-compose/"
    author: "Tube Archivist contributors, GPL-3.0"
    note: "Copied verbatim; the custom-port subsections left out, links made absolute. Upstream commit bb7ee4d."
---

Welcome to the official Tube Archivist Docs. This is an up-to-date documentation of user functionality.

## Getting Started

1. [Subscribe](https://docs.tubearchivist.com/channels/#channels-overview) to some of your favourite YouTube channels.
2. [Scan](https://docs.tubearchivist.com/downloads/#rescan-subscriptions) subscriptions to add the latest videos to the download queue.
3. [Add](https://docs.tubearchivist.com/downloads/#add-to-download-queue) additional videos, channels or playlist - ignore the ones you don't want to download.
4. [Download](https://docs.tubearchivist.com/downloads/#download-queue) and let **Tube Archivist** do it's thing.
5. Sit back and enjoy your archived and indexed collection!

## Setting up Tube Archivist with Docker

### Overview  

**Tube Archivist** depends on three containers:

1. The **Tube Archivist** container running the main application
2. Redis for queue and cache storage
3. ElasticSearch for your index.

> [!NOTE]
> All environment variables are documented at [installation/Environment Variables](https://docs.tubearchivist.com/installation/env-vars/).

> [!NOTE]
> Also see [installation/Docker for Beginners](https://docs.tubearchivist.com/installation/docker-for-beginners/) explaining some core concepts of docker and docker compose.

**Tube Archivist** requires Docker. Please make sure that Docker is installed and running on your computer before continuing.  

Also see:  

- [faq/How do I install this natively?](https://docs.tubearchivist.com/faq/#how-do-i-install-this-natively)
- [faq/Where is the .exe/.rpm/.pkg/.msi/&lt;insert installer here&gt;?](https://docs.tubearchivist.com/faq/#where-is-the-exerpmpkgmsiinsert-installer-here).

For minimal system requirements, the **Tube Archivist** stack needs around 2GB of available memory for a small testing setup and around 4GB of available memory for a mid to large sized installation. Minimum requirements for CPU are usually expected to be dual core with 4 threads, with better performance coming from quad core and higher, and more available threads.

> [!NOTE]
> For **arm64**: **Tube Archivist** is built as a multi-architecture (multi-arch) container, same for Redis. Elasticsearch should use the official image for arm64 support. Other architectures are not supported.

> [!WARNING]
> **Untested**
> ARM64 builds are essentially untested, as none of the devs have access to any ARM64 devices. There are regular unstable builds, for both architecture platforms. Help with testing to verify things are working as expected, also on ARM64.

Save the [docker-compose.yml](https://github.com/tubearchivist/tubearchivist/blob/master/docker-compose.yml) file from the **Tube Archivist** repository somewhere permanent on your system, keeping it named `docker-compose.yml`. You'll need to refer to it whenever starting this application.

### Install **Tube Archivist**

> [!NOTE]
> All you really _need_ to configure is the [`TA_HOST`](https://docs.tubearchivist.com/installation/env-vars/#ta_host) environment variable.

#### Networking
The main container serves the interface on port `8000` with Nginx. Nginx is packaged in the container and serves the static files and handles proxy requests to the backend.

- For port collisions, see [Docker for Beginners/#networking](https://docs.tubearchivist.com/installation/docker-for-beginners/#networking).
- Alternatively to modify the port, see [Environment Variables/#TA_PORT](https://docs.tubearchivist.com/installation/env-vars/#ta_port)

The React TS based frontend is compiled and served by Nginx from the `static` folder.

The Python Django based backend is served with `uvicorn` on the container internal port `8080`.

- Only container internal. Nginx handles proxying requests to the backend
- To modify, see [Environment Variables/#TA_BACKEND_PORT](https://docs.tubearchivist.com/installation/env-vars/#ta_backend_port)

#### Volumes
This container expects two volumes:

- `/cache`: That is not really a _cache_ any more now in the classical sense but holds persistent data like artwork and more.
- `/youtube`: Location for your downloaded video files.

### Install **Redis**

> [!CAUTION]
> **BE AWARE**
> Sharing the same Redis container between different projects is _not_ supported.

Redis functions as a cache and temporary link between the application and the file system. Redis is used to store and display messages and configuration variables. Redis is also responsible for keeping track of the queues.

  - Communicate by default over port `6379`
  - Needs a volume to allow persistence at `/data`.

### Install **ElasticSearch**
> [!TIP]
> **Elasticsearch Version**
> **Tube Archivist** depends on Elasticsearch 8.

Use `bbilly1/tubearchivist-es` to automatically get the recommended version, or use the official image with the version tag in the `docker-compose.yml` file.

Use the official Elasticsearch image for **arm64**.

Elasticsearch stores the video metadata and enables searchable functionality for all fields. Elasticsearch is also used to keep track of the download queue.

  - Needs to be accessible over the default port `9200`
  - Needs a volume to store persistent data linked to `/usr/share/elasticsearch/data`

Follow the [documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/docker.html) for additional installation details and options.
