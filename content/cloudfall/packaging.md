---
title: Package it so it runs
description: A reviewer has to be able to start your project. What "it runs" means in practice, and the docker-compose file that proves it.
group: build
order: 2
tags: [docker, readme, licence]
related:
  - guides/what-is-a-container
  - guides/how-compose-works
  - self-hosting-basics
  - submitting
---

Every submission has to be something a reviewer can open and use. For a website
that's a live link. For a self-hosted project which most CloudFALL projects are it's **a public repo and a Docker container**, so the reviewer can start it on
their own machine. Minor expections for things like homelabs with extensions, things like custom UPS, antenna, etc

## The minimum

A person who has never seen your project should be able to do this:

```bash
git clone https://github.com/you/your-project
cd your-project
cp .env.example .env      # if you need config at all
docker compose up -d
# open http://localhost:PORT
```
If your README's setup section is longer than a screen, that's may be a bad sign.

## A Dockerfile that works from a clean clone

```dockerfile title="Dockerfile"
FROM node:22-alpine
WORKDIR /app

# Dependencies first: this layer is cached until your lockfile changes.
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

```yaml title="docker-compose.yml"
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      # Sensible defaults, so `docker compose up` works with no .env at all.
      DATA_DIR: /data
    volumes:
      - ./data:/data
    restart: unless-stopped
```

Then verify it the way a reviewer will from a fresh clone, in a directory you
haven't been developing in:

```bash
git clone https://github.com/you/your-project /tmp/clean-check
cd /tmp/clean-check && docker compose up --build
```

That catches the file you never committed, which is the single most common reason
a project comes back.

> [!WARNING]
> Don't commit secrets. Ship `.env.example` with the _names_ of the variables and
> obviously-fake values, and keep the real `.env` in `.gitignore`. If a key has
> ever been committed, rotate it deleting the line doesn't remove it from
> history.

## The README a reviewer wants

- **One sentence on what it replaces.** "Self-hosted replacement for Strava's
  paid tier" tells a reviewer more than three paragraphs of feature list.
- **Screenshots.** At least one of the actual UI. Required, not decoration.
- **Setup.** The four commands above, exactly as they work.
- **A licence.** MIT, Apache-2.0 or similar. Without one, nobody can legally use
  it, and "open source" hasn't happened.

## Hosted, not self-hosted?

If your project is a website with a live URL, that URL is your "it runs" but
still ship the repo and keep it public.