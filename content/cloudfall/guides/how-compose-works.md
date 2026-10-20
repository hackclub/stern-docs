---
title: "How Compose works"
description: "Learn how Docker Compose works, from the application model to Compose files and CLI, whilst following a detailed example."
group: learn
order: 3
tags: [docker, basics]
related:
  - guides/what-is-a-container
  - guides/persisting-container-data
  - packaging
synced: "2026-10-20"
sources:
  - label: "Docker Docs, \"How Compose works\""
    href: "https://docs.docker.com/compose/intro/compose-application-model/"
    author: "Docker, Inc. and contributors, Apache-2.0"
    note: "Copied verbatim from the docker/docs repository; screenshots, video embeds and the Docker Desktop tab removed, links made absolute. Upstream commit 7efe900."
---

With Docker Compose you use a YAML configuration file, known as the [Compose file](#the-compose-file), to configure your application’s services, and then you create and start all the services from your configuration with the [Compose CLI](#cli). 

The Compose file, or `compose.yaml` file, follows the rules provided by the [Compose Specification](https://docs.docker.com/reference/compose-file/) in how to define multi-container applications. This is the Docker Compose implementation of the formal [Compose Specification](https://github.com/compose-spec/compose-spec).

## The Compose application model

Computing components of an application are defined as [services](https://docs.docker.com/reference/compose-file/services/). A service is an abstract concept implemented on platforms by running the same container image, and configuration, one or more times.

Services communicate with each other through [networks](https://docs.docker.com/reference/compose-file/networks/). In the Compose Specification, a network is a platform capability abstraction to establish an IP route between containers within services connected together.

Services store and share persistent data into [volumes](https://docs.docker.com/reference/compose-file/volumes/). The Specification describes such a persistent data as a high-level filesystem mount with global options.

## The Compose file

The default path for a Compose file is `compose.yaml` (preferred) or `compose.yml` that is placed in the working directory.
Compose also supports `docker-compose.yaml` and `docker-compose.yml` for backwards compatibility of earlier versions.
If both files exist, Compose prefers the canonical `compose.yaml`.

## CLI

The Docker CLI lets you interact with your Docker Compose applications through the `docker compose` command and its subcommands. If you're using Docker Desktop, the Docker Compose CLI is included by default.

Using the CLI, you can manage the lifecycle of your multi-container applications defined in the `compose.yaml` file. The CLI commands enable you to start, stop, and configure your applications effortlessly.

### Key commands 

To start all the services defined in your `compose.yaml` file:

```console
$ docker compose up
```

To stop and remove the running services:

```console
$ docker compose down 
```

If you want to monitor the output of your running containers and debug issues, you can view the logs with: 

```console
$ docker compose logs
```

To list all the services along with their current status:

```console
$ docker compose ps
```
