---
title: "Minecraft server"
description: "A Minecraft server is a player or business-owned multiplayer game server for the 2011 Mojang Studios video game Minecraft."
group: else
order: 1
tags: [games, minecraft]
related:
  - guides/what-is-a-container
  - guides/how-compose-works
  - what-you-pay-for
synced: "2026-10-20"
sources:
  - label: "Wikipedia, \"Minecraft server\""
    href: "https://en.wikipedia.org/w/index.php?title=Minecraft_server&oldid=1380785159"
    author: "Wikipedia contributors, CC BY-SA 4.0"
    note: "Lead copied verbatim. Revision of 2026-10-17."
  - label: "PaperMC Documentation, \"Getting started\""
    href: "https://docs.papermc.io/paper/getting-started"
    author: "PaperMC and contributors, BSD-2-Clause"
    note: "Copied verbatim; links made absolute, screenshots removed. Upstream commit eb798eb."
  - label: "PaperMC Documentation, \"Updating\""
    href: "https://docs.papermc.io/paper/updating"
    author: "PaperMC and contributors, BSD-2-Clause"
    note: "Copied verbatim; links made absolute, screenshots removed. Upstream commit eb798eb."
  - label: "PaperMC Documentation, \"Next steps\""
    href: "https://docs.papermc.io/paper/next-steps"
    author: "PaperMC and contributors, BSD-2-Clause"
    note: "Copied verbatim; links made absolute, screenshots removed. Upstream commit eb798eb."
  - label: "PaperMC Documentation, \"Adding plugins\""
    href: "https://docs.papermc.io/paper/adding-plugins"
    author: "PaperMC and contributors, BSD-2-Clause"
    note: "Copied verbatim; links made absolute, screenshots removed. Upstream commit eb798eb."
  - label: "itzg/docker-minecraft-server, \"Intro\""
    href: "https://docker-minecraft-server.readthedocs.io/en/latest/"
    author: "Geoff Bourne (itzg) and contributors, Apache-2.0"
    note: "Copied verbatim from docs/index.md; badges removed, links made absolute. Upstream commit 057d9c3."
---

A Minecraft server is a player or business-owned multiplayer game server for the 2011 Mojang Studios video game Minecraft. In this context, the term "server" often refers to a network of connected servers, rather than a single machine. Players can start their own server either by setting one up on a computer using software provided by Mojang, or by using a hosting provider so they can have their server run on dedicated machines with guaranteed uptime. The largest server is widely accepted to be the minigame server Hypixel, and previously, Mineplex.

Minecraft multiplayer servers are controlled by server operators, who have access to server commands such as setting the time of day, teleporting players, setting the world spawn, and changing players' gamemode. The server owner (or users that have access to the live server files) can also set up and install plugins to change the mechanics of the server, and can also set up restrictions concerning which usernames or IP addresses are allowed or disallowed to enter the game server.

Multiplayer servers have a wide range of activities: with some servers having unique premises, rules, and customs. Player versus player (PvP) combat can be enabled to allow fighting between players. Custom mods and plugins (server side mods) can be used with modified servers to allow actions that are not normally possible in the vanilla (unmodded) form of the game. There also exists a modification of the server software that can allow crossplay between the Java and Bedrock editions of the game.

## Getting started

### Requirements

> [!TIP]
> Paper requires at least **Java 25** to run, which [is easy to download and install](https://docs.papermc.io/misc/java-install).

| Paper Version     | Recommended Java Version |
|-------------------|--------------------------|
| 1.7.10 to 1.11    | Java 8                   |
| 1.12 to 1.16.4    | Java 11                  |
| 1.16.5            | Java 16                  |
| 1.17 to 1.19      | Java 17                  |
| 1.20 to 1.21.11   | Java 21                  |
| 26.1+             | Java 25                  |

### Downloading Paper

Paper provides runnable server JARs directly from our
[website's downloads page](https://papermc.io/downloads/paper).

Click on the build number to download a file.

### Running the server

To run the server you will need to either create a startup script
or run a command in your terminal.

You can generate a startup script using our [Startup Script Generator](https://docs.papermc.io/misc/tools/start-script-gen).
You can also obtain the optimized terminal command to run the server there.

If you're just looking for a short command:
```bash
java -Xms4G -Xmx4G -jar paper.jar --nogui
```
Ensure you navigated your terminal to the directory of your server
and that you have replaced `paper.jar` with the name of the JAR you have downloaded.

The amount of RAM can be set by changing the numbers in the `Xmx` and `Xms` arguments.
`--nogui` disables Vanilla's GUI, so you don't get double interfaces when using the command line.

To configure your server, see the [Global Configuration](https://docs.papermc.io/paper/reference/global-configuration) and
[Per World Configuration](https://docs.papermc.io/paper/reference/world-configuration) pages.

## Updating

Updating Paper is an important part of running every server. With new features and fixes coming
every day, we recommend updating at least once per week to keep your server patched for the latest
bugs. Installing updates is very simple, but it's important to know how to do it correctly.

> [!CAUTION]
> **Don't replace any JAR in a running server**
> Unless you know exactly what and why you're doing what you're doing, it's never a good idea to
> replace any JAR in a running server, be that plugins, or Paper itself.

### Step 1. Backup

> [!TIP]
> If you are using a shared host, your host may provide a built-in way to back up. Consult their
> documentation before continuing.

This is the most important step, and yet the most frequently skipped. While it is unlikely that
updating Paper itself will cause any issues requiring you to restore from a backup, plugin
malfunctions or other accidents might! Updating is a great time to work in a backup. Having
functioning backups is essential to every server, big or small. The main things to back up are:

- The world folders
- Server Configuration Files
- Plugin Configuration Files & Plugin JARs

You should aim to have backups from multiple times, and keep them in a safe place. A common approach
is to keep rolling backups, so you always have a certain number of backups from a set amount of time.

### Step 2. Update plugins

Just like it's important to update Paper, it's equally important to keep plugins up to date. You
never know what plugin authors may be working on, be it bugfixes or new features.

A little known feature of Paper servers is the `update` folder. Here's how you use it.

1. Create a folder called `update` within the `plugins` folder.
2. One by one, download plugins you would like to update and put them in the `update` folder.
3. Restart your server, do not remove or modify any plugins outside the `update` folder.

By doing this, you are able to update all of your plugins at the same time without having the server
off, or replacing plugin JARs while the server is running. You do not need to restart your server
before updating Paper itself. This feature allows you to update both Paper and plugins all at the
same time, without needing any additional downtime.

### Step 3. Update Paper

> [!TIP]
> If you are using a shared host, your host may provide a built-in way to update! Consult their
> documentation before continuing.

Updating Paper itself is very simple.

1. Download a new JAR from [our downloads page](https://papermc.io/downloads).
2. Stop your server. It is not recommended and may cause issues to replace your Paper JAR while the server is running.
3. Rename the downloaded file to match the name specified in the [start command](https://docs.papermc.io/paper/getting-started#running-the-server).
4. Replace your old Paper JAR file with the new renamed one.
5. Start your server. Watch the startup log to ensure everything goes to plan. If there are any
   plugin conflicts or issues, you will see them here.

To minimize downtime caused by updates, some server owners will, rather than replacing their server
JAR, upload a new one and set their start script to use the new one on the next restart. Both of
these are valid update strategies.

> [!CAUTION]
> **Automatic Updates**
> While it may be convenient to install updates automatically (and Paper's [downloads service](https://docs.papermc.io/misc/downloads-service) allows you
> to with ease), doing so is not recommended by Paper due to the possibility of plugin conflicts or
> other issues that you may not know about. Always be present during updates, and keep a careful watch
> on your server's log after the fact.
>
> If you do choose to automatically install updates, ensure you have a functioning backup strategy in
> place!

## Next steps

### Security

#### Whitelisting

If you want to restrict who can join your server, you can use the whitelist feature. This allows you to
specify who can join your server, and stops anyone else from joining. You can use the whitelist from
the server console, or by editing the `whitelist.json` file in your server directory.

#### Permissions

Permissions are a way to control what players can and cannot do on your server. You can use permissions
to restrict who can use certain commands, or who can access certain areas of your server. It is
common for plugins to use permissions to control who can use their features. You can use permission
plugins such as [LuckPerms](https://luckperms.net/) to manage the permissions which players will be granted.

### Backups

It's important to keep backups of your server. If something goes wrong, you can restore your server to a
previous state. We cover how to do this in the [Updating](https://docs.papermc.io/paper/updating) guide.

### Making your server public

If you want to make your server public, you will need to port forward your server. This allows people
from outside your network to connect to your server. There is a guide made by
[NordVPN](https://nordvpn.com/blog/open-ports-on-router/) which explains what port forwarding is and how
to do it for your Paper server.

## Adding plugins

Plugins are the most powerful way to extend the functionality of Paper beyond the configuration
files. Functionality added by plugins can range from making milk restore hunger or dead bushes grow,
to adding entirely new and original game modes or items.

> [!CAUTION]
> **Malicious Plugins**
> Ensure you fully trust the source of any plugin before installing it. Plugins are given **full and
> unrestricted** access to not only your server but also the machine that it runs on. Because of this,
> it is imperative that plugins only be installed from trusted sources. Be careful!

### Finding plugins

Before installing a plugin, you'll need to find what you want to install. The best place to find
plugins is [Hangar](https://hangar.papermc.io), Paper's plugin repository, but you can also find
plugins on [Modrinth](https://modrinth.com/discover/plugins?g=categories:paper) or
[BukkitDev](https://dev.bukkit.org/bukkit-plugins). Many plugins may release on [GitHub](https://github.com).
Instead of checking each site directly, you can also use a search engine. Searching for the function you
desire, followed by `Paper plugin` will often yield good results.

### Installing plugins

1. Once you've found the plugin you'd like to install, download it. Ensure the file you have
   downloaded ends in `.jar`. Some plugins also distribute as `.zip` files, in which case you will
   need to extract the file and locate the `.jar` for your platform, often labeled `bukkit` or
   `paper`.
2. Once you have the plugin downloaded locally, locate the `plugins` folder from the root directory
   of your Paper server.
3. Drag and drop the plugin file (`.jar`) into the `plugins` folder. If you are using a shared
   hosting service, you may need to use their web panel or SFTP to upload the plugin; however, the
   procedure will be the same.
4. Restart your server. The plugin should load.
5. Check your work. Once the server has finished loading, run the `/plugins` command in-game or type
   `plugins` into the console. You should see your freshly installed plugin listed in green. If it
   is not listed or is colored red, continue to [troubleshooting](https://docs.papermc.io/paper/adding-plugins#troubleshooting). A plugin listed
   in red means that it is not currently enabled. For a freshly installed plugin, this often means
   that the plugin failed to load.

## itzg/docker-minecraft-server

This docker image provides a Minecraft Server that will automatically download the latest stable
version at startup. You can also run/upgrade to any specific version or the
latest snapshot. See the _Versions_ section below for more information.

To simply use the latest stable version, run

    docker run -d -it -p 25565:25565 -e EULA=TRUE itzg/minecraft-server

where, in this case, the standard server port 25565 will be exposed on your host machine.

> [!IMPORTANT]
> **Persistent Data**
> The Minecraft server will store its data in the container's `/data` directory. This directory can be [mounted](https://docs.docker.com/storage/volumes/) from the host machine or a managed volume.
>
> Using `docker run` add a `-v` option somewhere before the image name:
>
> ```
> ... -v /path/on/host:/data itzg/minecraft-server
> ```
>
> Using docker compose, add a `volumes` section to the service definition:
>
> ```yaml
> services:
>   mc:
>     # ... image and environment section
>     volumes:
>       # attach the relative directory 'data' to the container's /data path
>       - ./data:data
> ```

> [!NOTE]
> If you plan on running a server for a longer amount of time it is highly recommended using a management layer such as [Docker Compose](#using-docker-compose) or [Kubernetes](https://docker-minecraft-server.readthedocs.io/en/latest/misc/deployment/#on-kubernetes) to allow for incremental reconfiguration and image upgrades.

> [!NOTE]
> Be sure to always include `-e EULA=TRUE` in your commands and container definitions, as Mojang/Microsoft requires EULA acceptance.

By default, the container will download the latest version of the "vanilla" [Minecraft: Java Edition server](https://www.minecraft.net/en-us/download/server) provided by Mojang. The [`VERSION`](https://docker-minecraft-server.readthedocs.io/en/latest/versions/minecraft/) and the [`TYPE`](https://docker-minecraft-server.readthedocs.io/en/latest/types-and-platforms/) can be configured to create many variations of desired Minecraft server. 

### Using [Docker Compose](https://docs.docker.com/compose/)

1. Create a new directory
2. Put the contents of the file below in a file called `compose.yaml`
3. Run `docker compose up -d` in that directory
4. Done! Point your client at your host's name/IP address and port 25565.

```yaml title="compose.yaml"

services:
  mc:
    image: itzg/minecraft-server:latest
    pull_policy: daily
    tty: true
    stdin_open: true
    ports:
      - "25565:25565"
    environment:
      EULA: "TRUE"
    volumes:
      # attach the relative directory 'data' to the container's /data path
      - ./data:/data
```

To apply changes made to the compose file, just run `docker compose up -d` again.

Follow the logs of the container using `docker compose logs -f`, check on the status with `docker compose ps`, and stop the container using `docker compose stop`.
