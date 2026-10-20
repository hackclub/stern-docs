---
title: "Immich"
description: "Here is a quick, no-choices path to install Immich and take it for a test drive."
group: store
order: 1
tags: [photos, backups]
related:
  - guides/syncthing
  - guides/persisting-container-data
  - pick-a-project
synced: "2026-10-20"
sources:
  - label: "Immich documentation, \"Quick start\""
    href: "https://docs.immich.app/overview/quick-start"
    author: "Immich contributors, AGPL-3.0"
    note: "Copied verbatim from the immich-app/immich repository docs; site components replaced with their text, links made absolute. Upstream commit fff2bd7."
  - label: "Immich documentation, \"Requirements\""
    href: "https://docs.immich.app/install/requirements"
    author: "Immich contributors, AGPL-3.0"
    note: "Copied verbatim from the immich-app/immich repository docs; site components replaced with their text, links made absolute. Upstream commit fff2bd7."
  - label: "Immich documentation, \"Docker Compose [Recommended]\""
    href: "https://docs.immich.app/install/docker-compose"
    author: "Immich contributors, AGPL-3.0"
    note: "Copied verbatim from the immich-app/immich repository docs; site components replaced with their text, links made absolute. Upstream commit fff2bd7."
  - label: "Immich documentation, \"Post installation steps\""
    href: "https://docs.immich.app/install/post-install"
    author: "Immich contributors, AGPL-3.0"
    note: "Copied verbatim from the immich-app/immich repository docs; site components replaced with their text, links made absolute. Upstream commit fff2bd7."
---

Here is a quick, no-choices path to install Immich and take it for a test drive.
Once you've tried it, you might use one of the many other ways
to install and use it.

## Requirements

- A system with at least 6GB of RAM and 2 CPU cores.
- [Docker](https://docs.docker.com/engine/install/)

> For a more detailed list of requirements, see the [requirements page](https://docs.immich.app/install/requirements).

### Hardware

- **OS**: Recommended Linux or \*nix 64-bit operating system (Ubuntu, Debian, etc).
  - Non-Linux OSes tend to provide a poor Docker experience and are strongly discouraged.
    Our ability to assist with setup or troubleshooting on non-Linux OSes will be severely reduced.
    If you still want to try to use a non-Linux OS, you can set it up as follows:
    - Windows: [Docker Desktop on Windows](https://docs.docker.com/desktop/install/windows-install/) or [WSL 2](https://docs.docker.com/desktop/wsl/).
    - macOS: [Docker Desktop on Mac](https://docs.docker.com/desktop/install/mac-install/).
  - Immich runs well in a virtualized environment when running in a full virtual machine.
    The use of Docker in LXC containers is [not recommended](https://pve.proxmox.com/wiki/Linux_Container), but may be possible for advanced users.
    If you have issues, we recommend that you switch to a supported VM deployment.
- **RAM**: Minimum 6GB, recommended 8GB.
- **CPU**: Minimum 2 cores, recommended 4 cores.
  - Immich runs on the `amd64` and `arm64` platforms.
    Since `v3`, the machine learning container on `amd64` requires the `>= x86-64-v2` [microarchitecture level](https://en.wikipedia.org/wiki/X86-64#Microarchitecture_levels).
    Most CPUs released since ~2012 support this microarchitecture.
    If you are using a virtual machine, ensure you have selected a [supported microarchitecture](https://pve.proxmox.com/pve-docs/chapter-qm.html#_qemu_cpu_types).
    If you are unable to support this instruction set, the last version to support `x86-64-v1` is `v2.7.5`.
    Note that this release is no longer supported, and you must run a matching `immich-server` version.
- **Storage**: Recommended Unix-compatible filesystem (EXT4, ZFS, APFS, etc.) with support for user/group ownership and permissions.
  - The generation of thumbnails and transcoded video can increase the size of the photo library by 10-20% on average.

> [!NOTE]
> **RAM requirements**
> For a smooth experience, especially during asset upload, Immich requires at least 6GB of RAM.
> For systems with only 4GB of RAM, Immich can be run with machine learning features disabled.

> [!TIP]
> **Postgres setup**
> Good performance and a stable connection to the Postgres database is critical to a smooth Immich experience.
> The Postgres database files are typically between 1-3 GB in size.
> For this reason, the Postgres database (`DB_DATA_LOCATION`) should ideally use local SSD storage, and never a network share of any kind.
> Additionally, if Docker resource limits are used, the Postgres database requires at least 2GB of RAM.
> Windows users may run into issues with non-Unix-compatible filesystems, see below for more details.

### Software

Immich requires [**Docker**](https://docs.docker.com/get-started/get-docker/) with the **Docker Compose plugin**:

- **Docker Engine**: This CLI variant is designed for Linux servers (or Windows via WSL2).
- **Docker Desktop**: This GUI variant is **not recommended** for Linux, but is available for Windows or macOS.

The Compose plugin will be installed by both Docker Engine and Desktop by following the linked installation guides; it can also be [separately installed](https://docs.docker.com/compose/install/).

> [!NOTE]
> Immich requires the command `docker compose`; the similarly named `docker-compose` is [deprecated](https://docs.docker.com/retired/#docker-compose-v1-replaced-by-compose-v2) and is no longer supported by Immich.

## Set up the server

### Step 1 - Download the required files

Create a directory of your choice (e.g. `./immich-app`) to hold the `docker-compose.yml` and `.env` files.

```bash title="Move to the directory you created"
mkdir ./immich-app
cd ./immich-app
```

Download [`docker-compose.yml`](https://github.com/immich-app/immich/releases/latest/download/docker-compose.yml) and [`example.env`](https://github.com/immich-app/immich/releases/latest/download/example.env) by running the following commands:

```bash title="Get docker-compose.yml file"
wget -O docker-compose.yml https://github.com/immich-app/immich/releases/latest/download/docker-compose.yml
```

```bash title="Get .env file"
wget -O .env https://github.com/immich-app/immich/releases/latest/download/example.env
```

You can alternatively download these two files from your browser and move them to the directory that you created, in which case ensure that you rename `example.env` to `.env`.

### Step 2 - Populate the .env file with custom values

```bash title="Default environmental variable content"
# You can find documentation for all the supported env variables at https://docs.immich.app/install/environment-variables

# The location where your uploaded files are stored
UPLOAD_LOCATION=./library

# The location where your database files are stored. Network shares are not supported for the database
DB_DATA_LOCATION=./postgres

# To set a timezone, uncomment the next line and change Etc/UTC to a TZ identifier from this list: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones#List
# TZ=Etc/UTC

# The Immich version to use. You can pin this to a specific version like "v2.1.0"
IMMICH_VERSION=v3

# Connection secret for postgres. You should change it to a random password
# Please use only the characters `A-Za-z0-9`, without special characters or spaces
DB_PASSWORD=postgres

# The values below this line do not need to be changed
###################################################################################
DB_USERNAME=postgres
DB_DATABASE_NAME=immich
```

- Populate `UPLOAD_LOCATION` with your preferred location for storing backup assets. It should be a new directory on the server with enough free space.
- Consider changing `DB_PASSWORD` to a custom value. Postgres is not publicly exposed, so this password is only used for local authentication.
  To avoid issues with Docker parsing this value, it is best to use only the characters `A-Za-z0-9`. `pwgen` is a handy utility for this.
- Set your timezone by uncommenting the `TZ=` line.
- Populate custom database information if necessary.

### Step 3 - Start the containers

From the directory you created in Step 1 (which should now contain your customized `docker-compose.yml` and `.env` files), run the following command to start Immich as a background service:

```bash title="Start the containers"
docker compose up -d
```

## Try the web app

The first user to register will be the admin user. The admin user will be able to add other users to the application.

To register for the admin user, access the web application at `http://<machine-ip-address>:2283` and click on the **Getting Started** button.

Follow the prompts to register as the admin user and log in to the application.

Try uploading a picture from your browser.

## Review the database backup and restore process

Immich has built-in database backups. You can refer to the
[database backup](https://docs.immich.app/administration/backup-and-restore) for more information.

> [!CAUTION]
> The database only contains metadata and user information. You must setup manual backups of the images and videos stored in `UPLOAD_LOCATION`.

## Setup Server Backups

Now that you have imported some pictures, you should setup server backups to preserve your memories.
You can do so by following our [backup guide](https://docs.immich.app/administration/backup-and-restore).

> [!NOTE]
> A 3-2-1 backup strategy is still crucial. The team has the responsibility to ensure that the application doesn’t cause loss of your precious memories; however, we cannot guarantee that hard drives will not fail, or an electrical event causes unexpected shutdown of your server/system, leading to data loss. Therefore, we still encourage users to follow best practices when safeguarding their data. Keep multiple copies of your most precious data: at least two local copies and one copy offsite in cold storage.
