---
title: Self-hosting basics
description: How to create your own cloud at home
group: build
order: 1
tags: [docker, server, backups, vpn]
related:
  - guides/self-hosting
  - guides/what-is-a-container
  - guides/how-compose-works
  - guides/persisting-container-data
  - guides/jellyfin
  - packaging
---

Creating your own server isn't hard, a server is a computer that gives(serves) data to other computers(clients). All you need to do to create a server is have a computer that can share data to another computer. This can be a Pi, old desktop or even a chromebook.

## The box

You probably already own it:

- A laptop with a cracked screen that still boots.
- A Raspberry Pi in a drawer.
- The desktop in the basement nobody uses.

If it turns on and stays on, it can serve your house. You don't need anything big, fancy, all you need is internet(preferable ethernet), a device, and power

```bash
# Ubuntu/Debian laptop: don't sleep when the lid shuts.
sudo systemctl mask sleep.target suspend.target hibernate.target
```

## One file starts the whole thing

Almost everything worth running uses a Docker Compose file. You paste it in and
run one command:

```yaml title="docker-compose.yml"
services:
  jellyfin:
    image: jellyfin/jellyfin
    container_name: jellyfin
    ports:
      - "8096:8096"
    volumes:
      - ./config:/config
      - ./cache:/cache
      - /mnt/media:/media
    restart: unless-stopped
```

```bash
docker compose up -d      # start it, in the background(note older docker verisons use "docker-compose" instead of "docker compose")
docker compose logs -f    # watch it boot; ctrl-c to stop watching
docker compose down       # stop it
```

That's the key to nearly every service you'll run. Learn to read that file and
most of self-hosting stops being mysterious.

> [!TIP]
> Paste your compose file in **#ysws-CloudFALL** and someone will read it line by
> line with you. This is the single fastest way to get unstuck.

## Reach it from anywhere, safely

You do not need a static IP, and you should not open ports on your home router
to get started. A mesh VPN puts your phone and your server on the same private
network in about five minutes:

1. Install [Tailscale](https://tailscale.com/) on the server and on your phone.
2. Sign in to the same account on both.
3. Use the server's Tailscale address instead of its local IP. It works from
   anywhere, on any network.

> [!WARNING]
> Port-forwarding a service straight onto the public internet exposes it to
> everyone who scans that port, which is everyone. If you do need a public URL,
> put a reverse proxy with HTTPS in front of it and keep the service itself
> private.

## Safety first

It's a bit costly but no one wants to lose their family photos.
Two copies, one of them somewhere else. That's the whole rule, and it's the part
people skip until they lose something.

- **Copy one** is the drive the service runs on.
- **Copy two** is anywhere that isn't in the same building another drive you
  take somewhere, or discs/SSDs, which is what the blank spindles in the
  program shop are for. you can even use google drive for this(ironically)

Test the restore, not just the backup. An untested backup is a hope.

## Then what

Get the thing you built running the same way a repo someone else can clone and
a container they can start. [Submitting your project](/cloudfall/submitting)
covers what that has to look like.
