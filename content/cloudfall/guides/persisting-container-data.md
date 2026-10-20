---
title: "Persisting container data"
description: "This concept page will teach you the significance of data persistence in Docker"
group: learn
order: 4
tags: [docker, backups]
related:
  - guides/how-compose-works
  - guides/hardlinks
synced: "2026-10-20"
sources:
  - label: "Docker Docs, \"Persisting container data\""
    href: "https://docs.docker.com/get-started/docker-concepts/running-containers/persisting-container-data/"
    author: "Docker, Inc. and contributors, Apache-2.0"
    note: "Copied verbatim from the docker/docs repository; screenshots, video embeds and the Docker Desktop tab removed, links made absolute. Upstream commit 7efe900."
---

When a container starts, it uses the files and configuration provided by the image. Each container is able to create, modify, and delete files and does so without affecting any other containers. When the container is deleted, these file changes are also deleted.

While this ephemeral nature of containers is great, it poses a challenge when you want to persist the data. For example, if you restart a database container, you might not want to start with an empty database. So, how do you persist files?

### Container volumes

Volumes are a storage mechanism that provide the ability to persist data beyond the lifecycle of an individual container. Think of it like providing a shortcut or symlink from inside the container to outside the container. 

As an example, imagine you create a volume named `log-data`. 

```console
$ docker volume create log-data
```

When starting a container with the following command, the volume will be mounted (or attached) into the container at `/logs`:

```console
$ docker run -d -p 80:80 -v log-data:/logs docker/welcome-to-docker
```

If the volume `log-data` doesn't exist, Docker will automatically create it for you. 

When the container runs, all files it writes into the `/logs` folder will be saved in this volume, outside of the container. If you delete the container and start a new container using the same volume, the files will still be there.

> **Sharing files using volumes**
>
> You can attach the same volume to multiple containers to share files between containers. This might be helpful in scenarios such as log aggregation, data pipelines, or other event-driven applications.

### Managing volumes

Volumes have their own lifecycle beyond that of containers and can grow quite large depending on the type of data and applications you’re using. The following commands will be helpful to manage volumes:

- `docker volume ls` - list all volumes
- `docker volume rm <volume-name-or-id>` - remove a volume (only works when the volume is not attached to any containers)
- `docker volume prune` - remove all unused (unattached) volumes
