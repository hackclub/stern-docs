---
title: "Pi-hole"
description: "Pi-hole is a Linux network-level advertisement and Internet tracker blocking application which acts as a DNS sinkhole and optionally a DHCP server, intended for use on a private network."
group: else
order: 2
tags: [dns, ads, network]
related:
  - guides/what-is-a-container
  - self-hosting-basics
synced: "2026-10-20"
sources:
  - label: "Wikipedia, \"Pi-hole\""
    href: "https://en.wikipedia.org/w/index.php?title=Pi-hole&oldid=1371629808"
    author: "Wikipedia contributors, CC BY-SA 4.0"
    note: "Lead copied verbatim. Revision of 2026-08-27."
  - label: "Pi-hole documentation, \"Prerequisites\""
    href: "https://docs.pi-hole.net/main/prerequisites/"
    author: "Pi-hole LLC and contributors, CC BY-SA 4.0"
    note: "Hardware, IP Addressing and Ports copied verbatim; links made absolute. Upstream commit 51512c2."
  - label: "Pi-hole documentation, \"Docker\""
    href: "https://docs.pi-hole.net/docker/"
    author: "Pi-hole LLC and contributors, CC BY-SA 4.0"
    note: "Quick-start section copied verbatim. Upstream commit 51512c2."
  - label: "Pi-hole documentation, \"Installation\""
    href: "https://docs.pi-hole.net/main/basic-install/"
    author: "Pi-hole LLC and contributors, CC BY-SA 4.0"
    note: "One-Step Automated Install copied verbatim. Upstream commit 51512c2."
  - label: "Pi-hole documentation, \"Post-Install\""
    href: "https://docs.pi-hole.net/main/post-install/"
    author: "Pi-hole LLC and contributors, CC BY-SA 4.0"
    note: "First section copied verbatim. Upstream commit 51512c2."
---

Pi-hole is a Linux network-level advertisement and Internet tracker blocking application which acts as a DNS sinkhole and optionally a DHCP server, intended for use on a private network. It is designed for low-power embedded devices with network capability, such as the Raspberry Pi, but can be installed on almost any Linux system. As well as importing externally prepared blocklists, Pi-hole can be configured to block specific websites or apply parental controls.

## Prerequisites

### Hardware

Pi-hole is very lightweight and does not require much processing power

- Min. 2GB free space, 4GB recommended
- 512MB RAM

> [!NOTE]
> A Pi-hole branded kit, including everything you need to get started, can be purchased from The Pi Hut, [here](https://thepihut.com/products/official-pi-hole-raspberry-pi-4-kit).

Despite the name, you are not limited to running Pi-hole on a Raspberry Pi.
Any hardware that runs one of the supported operating systems will do!

### IP Addressing

Pi-hole needs a static IP address to properly function (a DHCP reservation is just fine).

### Ports

| Service | Port | Protocol | Notes |
| -------------------- | ------------- | --------- | -------------------- |
| pihole-FTL | 53  (DNS) | TCP/UDP | If you happen to have another DNS server running, such as BIND, you will need to turn it off in order for Pi-hole to respond to DNS queries. |
| pihole-FTL | 67  (DHCP) | IPv4 UDP | The DHCP server is an optional feature that requires additional ports. |
| pihole-FTL | 547 (DHCPv6) | IPv6 UDP | The DHCP server is an optional feature that requires additional ports. |
| pihole-FTL | 80  (HTTP)<br/>443   (HTTPS) | TCP | If you have another webserver already listening on port `80`/`443`, then `pihole-FTL` will attempt to bind to `8080`/`8443` instead. If neither of these ports are available, `pihole-FTL`'s webserver will be unavailable until ports are configured manually (see configuration option `webserver.port`) |
| pihole-FTL | 123 (NTP) | UDP | The NTP server is an optional feature that requires an additional port. |

> [!NOTE]
> The use of pihole-FTL on ports _67_ or _547_ is optional, but required if you use the DHCP functions of Pi-hole.
> The use of port _123_ is required when using pihole-FTL as NTP-Server.

## Docker

The easiest way to get up and running with Pi-hole on Docker is to use our quick-start `docker-compose.yml` template.

Copy the below [Docker Compose](https://docs.docker.com/compose/) example and customize as needed

```yaml
# More info at https://github.com/pi-hole/docker-pi-hole/ and https://docs.pi-hole.net/
services:
  pihole:
    container_name: pihole
    image: pihole/pihole:latest
    ports:
      # DNS Ports
      - "53:53/tcp"
      - "53:53/udp"
      # Default HTTP Port
      - "80:80/tcp"
      # Default HTTPs Port. FTL will generate a self-signed certificate
      - "443:443/tcp"
      # Uncomment the below if using Pi-hole as your DHCP Server
      #- "67:67/udp"
      # Uncomment the line below if you are using Pi-hole as your NTP server
      #- "123:123/udp"
    environment:
      # Set the appropriate timezone for your location from
      # https://en.wikipedia.org/wiki/List_of_tz_database_time_zones, e.g:
      TZ: 'Europe/London'
      # Set a password to access the web interface. Not setting one will result in a random password being assigned
      FTLCONF_webserver_api_password: 'correct horse battery staple'
      # If using Docker's default `bridge` network setting the dns listening mode should be set to 'ALL'
      FTLCONF_dns_listeningMode: 'ALL'
    # Volumes store your data between container upgrades
    volumes:
      # For persisting Pi-hole's databases and common configuration file
      - './etc-pihole:/etc/pihole'
      # Uncomment the below if you have custom dnsmasq config files that you want to persist. Not needed for most starting fresh with Pi-hole v6. If you're upgrading from v5 you and have used this directory before, you should keep it enabled for the first v6 container start to allow for a complete migration. It can be removed afterwards. Needs environment variable FTLCONF_misc_etc_dnsmasq_d: 'true'
      #- './etc-dnsmasq.d:/etc/dnsmasq.d'
    cap_add:
      # See https://docs.pi-hole.net/docker/configuration/#note-on-capabilities
      # Required if you are using Pi-hole as your DHCP server, else not needed
      - NET_ADMIN
      # Required if you are using Pi-hole as your NTP client to be able to set the host's system time
      - SYS_TIME
      # Optional, if Pi-hole should get some more processing time
      - SYS_NICE
    restart: unless-stopped
```

Run `docker compose up -d` to build and start Pi-hole (on older systems, the syntax here may be `docker-compose up -d`)

The equivalent command for `docker run` would be:

```bash
docker run --name pihole -p 53:53/tcp -p 53:53/udp -p 80:80/tcp -p 443:443/tcp -e TZ=Europe/London -e FTLCONF_webserver_api_password="correct horse battery staple" -e FTLCONF_dns_listeningMode=all -v ./etc-pihole:/etc/pihole -v ./etc-dnsmasq.d:/etc/dnsmasq.d --cap-add NET_ADMIN --restart unless-stopped pihole/pihole:latest
```

## One-Step Automated Install

Those who want to get started quickly and conveniently may install Pi-hole using the following command:

```bash
curl -sSL https://install.pi-hole.net | bash
```

> [!NOTE]
> [Piping to `bash` is a controversial topic](https://pi-hole.net/2016/07/25/curling-and-piping-to-bash/), as it prevents you from [reading code that is about to run](https://github.com/pi-hole/pi-hole/blob/master/automated%20install/basic-install.sh) on your system.
>
> If you would prefer to review the code before installation, we provide these alternative installation methods.

## Making your network take advantage of Pi-hole

Once the installer has been run, you will need to [configure your router to have **DHCP clients use Pi-hole as their DNS server**](https://discourse.pi-hole.net/t/how-do-i-configure-my-devices-to-use-pi-hole-as-their-dns-server/245) which ensures all devices connected to your network will have content blocked without any further intervention.

If your router does not support setting the DNS server, you can [use Pi-hole's built-in DHCP server](https://discourse.pi-hole.net/t/how-do-i-use-pi-holes-built-in-dhcp-server-and-why-would-i-want-to/3026); just be sure to disable DHCP on your router first (if it has that feature available).

As a last resort, you can manually set each device to use Pi-hole as its DNS server.
