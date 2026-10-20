---
title: "Syncthing"
description: "Syncthing is a peer-to-peer file synchronization utility, designed to sync files between devices on a local network or between remote devices over the Internet."
group: store
order: 2
tags: [files, backups]
related:
  - guides/immich
  - self-hosting-basics
synced: "2026-10-20"
sources:
  - label: "Wikipedia, \"Syncthing\""
    href: "https://en.wikipedia.org/w/index.php?title=Syncthing&oldid=1374273314"
    author: "Wikipedia contributors, CC BY-SA 4.0"
    note: "Lead, Technology and Configuration and management sections copied verbatim. Revision of 2026-09-10."
---

Syncthing is a peer-to-peer file synchronization utility, designed to sync files between devices on a local network or between remote devices over the Internet. It runs on Windows, macOS, Linux, Android, iOS, *BSD and illumos. The software is free and open source, and its version 1.0 was released in 2019 after 5 years in beta.

The Syncthing server runs in the background as a daemon and provides a graphical user interface to the user for configuring the shared folders and devices. The interface is accessed in a web browser using the localhost address http://127.0.0.1:8384. Data security and safety are built into its design with all Syncthing data transfers encrypted using TLS.

## Technology

Syncthing is written in Go and implements its own, likewise free Block Exchange Protocol.

Syncthing is a BYO cloud model, running on user-provided hardware. It supports IPv6 and, for those on IPv4 networks, NAT punching and relays. Connecting a device requires explicit approval (except where the Introducer feature is used), which increases the security of the mesh. All data, whether transferred directly between devices or via relays, is encrypted using TLS.

Conflicts are handled by renaming the older file with a "sync-conflict" suffix (along with time stamp), enabling the user to decide how to manage two or more files of the same name that have been changed between syncing. GUI wrappers can use these files to offer the user a method of resolving conflicts without having to resort to manual file handling.

Efficient syncing is achieved via compression of metadata and all transfer data, block re-use, and lightweight scanning for changed files once a full hash has been computed and saved. Syncthing offers send-only and receive-only folder types, in which updates from remote devices are not processed, various types of file versioning (trash can, simple or staggered versioning, and handing versioning to an external program or script), and file/path ignore patterns. Two different SHA256 hash implementations are currently supported, the faster of which is used dynamically after a brief benchmark on startup. Moving and renaming files and folders is handled efficiently, without re-downloading existing data.

## Configuration and management

Syncthing provides a web-based interface for configuring and monitoring the status, via a web browser either locally (localhost at default port 8384) or remotely (and supports access via proxy server). The interface allows users to choose and manage the folders for sharing and also the devices part of the synchronization. Every computer in Syncthing has a unique Device ID which is used for adding new devices to the syncing network with approval.

Syncthing is currently directly available for Windows, macOS, Linux, FreeBSD, OpenBSD and illumos platforms. Some platforms no longer have provided prebuilt versions and must be manually compiled. There are also community-contributed Syncthing wrapper programs such as SyncTrayzor for Windows (which runs as a taskbar tray utility), Syncthing-Fork for Android and Möbius Sync for iOS. An official Android client was available on the Google Play Store until 2024. 

For more advanced users, it is also possible to edit the Syncthing configuration file directly without using the interface or to use Syncthing using a command-line interface. Links to Docker images are also provided on the community contributions page, as well as links to supported configuration management solutions such as Puppet, Ansible and others.

Official documentation: [docs.syncthing.net](https://docs.syncthing.net/).
