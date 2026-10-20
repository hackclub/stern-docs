---
title: "Self-hosting"
description: "Self-hosting is the practice of running a website or service on a home server instead of a web hosting service outside of the administrator's own control."
group: learn
order: 1
tags: [basics, server]
related:
  - self-hosting-basics
  - guides/what-is-a-container
  - guides/how-compose-works
synced: "2026-10-20"
sources:
  - label: "Wikipedia, \"Self-hosting (network)\""
    href: "https://en.wikipedia.org/w/index.php?title=Self-hosting_(network)&oldid=1366399103"
    author: "Wikipedia contributors, CC BY-SA 4.0"
    note: "Sections copied verbatim; wiki markup converted to Markdown. Revision of 2026-07-27."
  - label: "Wikipedia, \"Home server\""
    href: "https://en.wikipedia.org/w/index.php?title=Home_server&oldid=1357085181"
    author: "Wikipedia contributors, CC BY-SA 4.0"
    note: "Lead and the Media serving and BitTorrent sections copied verbatim. Revision of 2026-05-31."
  - label: "Self-Hosting Guide, \"Getting Started with Self-Hosting\""
    href: "https://github.com/mikeroyal/Self-Hosting-Guide#getting-started-with-self-hosting"
    author: "Mike Royal, CC BY 4.0"
    note: "The two opening paragraphs copied verbatim from README.md. Upstream commit 3eaf827."
---

Self-hosting is the practice of running a website or service on a home server instead of a web hosting service outside of the administrator's own control. Self-hosting allows users to have more control over their data, privacy, and computing infrastructure, as well as potentially saving costs and improving skills.

## Getting Started with Self-Hosting

[Self-Hosting](https://www.reddit.com/r/selfhosted/) is the practice of locally hosting(on premises & private web servers) and managing software applications by a person or organization instead of monthly subscriptions from [Software as a service (SaaS) providers](https://azure.microsoft.com/en-us/overview/what-is-saas/).  

Most self-hosted software can be installed using [Docker](https://en.wikipedia.org/wiki/Docker_(software)), a packaging system which allows software to bundle their configuration and dependencies and isolate them from your operating system.  Software using docker can be installed using the command line or via graphical interfaces such as [Portainer](https://github.com/portainer/portainer).  Software is installed with Docker by downloading an image file containing the application, then creating a copy that sets up its own dependencies and configuration within what is called a container.  Without containers you would often need to install different versions of the same programming languages or tools to satisfy the dependencies for the software you want to use which can get complicated.

## Benefits

Self-hosting software often allows a user greater customization over their software experience compared to solutions in the cloud. For example, Jellyfin has many add-ons allowing for new types of program information, interfaces, subtitles and other features that are not available on commercial streaming services. A self-hosted RSS reader can help a user control their own source of news, rather than be reliant on a corporation's algorithm to deliver their news. This degree of control can make self-hosted software more resistant to enshittification.

Self-hosted services are usually more privacy-respecting because the user is hosting the data on hardware under their control, meaning that a for-profit company will not be able to leverage that data to generate revenue from targeted ads or similar strategies. The fact that the data does not leave the premises where it is stored also means the user may be less susceptible to mass surveillance, such as by hosting personal photographs on Immich to avoid those personal data being accessible to Google on Google Photos.

While some self-hosted software solutions offer subscriptions to support their development, many are distributed via open-source repositories. This can allow a user to save money over the long term, such as by using Nextcloud to avoid subscriptions for cloud storage which often increase over time.

## Downsides

While self-hosting can save money in some aspects, it also involves costs, such as for the computing hardware itself, but also the electricity costs, which some advanced users have noted can be unexpectedly high. If users access their self-hosted services on a domain they own, there is usually a cost involved in registering the domain.

Performance can be faster on local hardware due to the lower latency, but it can sometimes be slower on self-hosted hardware, particularly if attempting to host on under-powered devices such as single-board computers like Raspberry Pi, which can struggle to run intensive processes involved in speech-to-text algorithms, video encoding and similar applications.

Security must be considered when self-hosting software exposed to the public internet. Making resources on a home network remotely accessible usually involves port forwarding, setting up encryption methods like HTTPS, and other networking approaches which if not configured correctly, could become an attack surface for hackers and thieves. It is also recommended to back up any self-hosted data to a second location, potentially offsite, to ensure all data isn't lost in case of a fire, flood or other disaster that could destroy hardware in a home.

Self-hosting software often has a steeper learning curve than competing software because of the need to learn about computer networking, security, and software configuration on environments such as Linux and the command line. This can require more time investment than paid alternatives.

## Home server

A home server is a computing server located in a private residence providing services to other devices inside or outside the household through a home network or the Internet. Such services may include file and printer serving, media center serving, home automation control, web serving (on the network or Internet), web caching, file sharing and synchronization, video surveillance and digital video recorder, calendar and contact sharing and synchronization, account authentication, and backup services.

Because of the relatively low number of computers on a typical home network, a home server commonly does not require significant computing power. Home servers can be implemented do-it-yourself style with a re-purposed, older computer, or a plug computer; pre-configured commercial home server appliances are also available. An uninterruptible power supply is sometimes used in case of power outages that can possibly corrupt data.

### Media serving

Home servers are often used to serve multi-media content, including photos, music, and video to other devices in the household (and even to the Internet; see Space shifting, Tonido and Orb). Using standard protocols such as DLNA or proprietary systems such as iTunes, users can access their media stored on the home server from any room in the house. Windows XP Media Center Edition, Windows Vista, and Windows 7 can act as a home server, supporting a particular type of media serving that streams the interactive user experience to Media Center Extenders including the Xbox 360.

Services such as Windows Home Server are less used, likely due to modern services such as Plex and Jellyfin. These services allow users to store their media on a NAS and stream and sometimes download it to devices within the network and optionally to devices outside the network. These services automatically sort users media and find metadata and sometimes subtitles. They also track and remember users progress within a movie or series so they can continue from where they left off.

### BitTorrent

Home servers are ideal for utilizing the BitTorrent protocol for downloading and seeding files as some torrents can take days, or even weeks to complete and perform better on an uninterrupted connection. There are many text based clients such as rTorrent and web-based ones such as TorrentFlux and Tonido available for this purpose. BitTorrent also makes it easier for those with limited bandwidth to distribute large files over the Internet.

## Further reading

- [Self-Hosting Guide](https://github.com/mikeroyal/Self-Hosting-Guide)
- [awesome-selfhosted](https://github.com/awesome-selfhosted/awesome-selfhosted)
- [selfh.st](https://selfh.st/)
- [r/selfhosted](https://www.reddit.com/r/selfhosted/)
