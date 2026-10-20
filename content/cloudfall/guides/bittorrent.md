---
title: "BitTorrent"
description: "BitTorrent is a communication protocol for peer-to-peer file sharing (P2P), which enables users to distribute data and electronic files over the Internet in a decentralized manner."
group: learn
order: 5
tags: [torrents, downloads]
related:
  - guides/hardlinks
  - guides/jellyfin
synced: "2026-10-20"
sources:
  - label: "Wikipedia, \"BitTorrent\""
    href: "https://en.wikipedia.org/w/index.php?title=BitTorrent&oldid=1380656127"
    author: "Wikipedia contributors, CC BY-SA 4.0"
    note: "Lead and parts of the Design, Creating and publishing, Anonymity, Legislation and Security sections copied verbatim. Revision of 2026-10-17."
  - label: "Wikipedia, \"Seeding (computing)\""
    href: "https://en.wikipedia.org/w/index.php?title=Seeding_(computing)&oldid=1379776091"
    author: "Wikipedia contributors, CC BY-SA 4.0"
    note: "Lead copied verbatim. Revision of 2026-10-11."
  - label: "Wikipedia, \"Torrent file\""
    href: "https://en.wikipedia.org/w/index.php?title=Torrent_file&oldid=1376196185"
    author: "Wikipedia contributors, CC BY-SA 4.0"
    note: "Lead copied verbatim. Revision of 2026-09-22."
  - label: "Wikipedia, \"Legal issues with BitTorrent\""
    href: "https://en.wikipedia.org/w/index.php?title=Legal_issues_with_BitTorrent&oldid=1367743959"
    author: "Wikipedia contributors, CC BY-SA 4.0"
    note: "First paragraph copied verbatim. Revision of 2026-08-04."
  - label: "BEP 3: The BitTorrent Protocol Specification"
    href: "https://www.bittorrent.org/beps/bep_0003.html"
    author: "Bram Cohen; placed in the public domain"
    note: "Opening section copied verbatim; reStructuredText converted to Markdown. Upstream commit 7b7b41f."
---

BitTorrent is a communication protocol for peer-to-peer file sharing (P2P), which enables users to distribute data and electronic files over the Internet in a decentralized manner. The act of downloading and uploading data via BitTorrent is also labeled "torrenting". The protocol is developed and maintained by Rainberry, Inc., and was first released in 2001.

To send or receive files, users use a BitTorrent client on their Internet-connected computer, which are available for a variety of computing platforms and operating systems, including an official client. BitTorrent trackers provide a list of files available for transfer and allow the client to find peer users, known as "seeds", who may transfer the files. BitTorrent downloading is considered to be faster than HTTP ("direct downloading") and FTP due to the lack of a central server that could limit bandwidth.

BitTorrent is one of the most common protocols for transferring large files, such as digital video files containing TV shows and video clips, or digital audio files. BitTorrent accounted for a third of all internet traffic in 2004, according to a study by Cachelogic. As recently as 2019 BitTorrent remained a significant file sharing protocol according to Sandvine, generating a substantial amount of Internet traffic, with 2.46% of downstream, and 27.58% of upstream traffic, although this share has declined significantly since then.

## Design

The BitTorrent protocol can be used to reduce the server and network impact of distributing large files. Rather than downloading a file from a single source server, the BitTorrent protocol allows users to join a "swarm" of hosts to upload and download from each other simultaneously. The protocol is an alternative to the older single source, multiple mirror sources technique for distributing data, and can work effectively over networks with lower bandwidth. Using the BitTorrent protocol, several basic computers, such as home computers, can replace large servers while efficiently distributing files to many recipients. This lower bandwidth usage also helps prevent large spikes in internet traffic in a given area, keeping internet speeds higher for all users in general, regardless of whether or not they use the BitTorrent protocol.

The file being distributed is divided into segments called pieces. As each peer receives a new piece of the file, it becomes a source (of that piece) for other peers, relieving the original seed from having to send that piece to every computer or user wishing a copy. With BitTorrent, the task of distributing the file is shared by those who want it; it is entirely possible for the seed to send only a single copy of the file itself and eventually distribute to an unlimited number of peers. Each piece is protected by a cryptographic hash contained in the torrent descriptor. This ensures that any modification of the piece can be reliably detected, and thus prevents both accidental and malicious modifications of any of the pieces received at other nodes. If a node starts with an authentic copy of the torrent descriptor, it can verify the authenticity of the entire file it receives.

Pieces are typically downloaded non-sequentially, and are rearranged into the correct order by the BitTorrent client, which monitors which pieces it needs, and which pieces it has and can upload to other peers. Pieces are of the same size throughout a single download (for example, a 10 MB file may be transmitted as ten 1 MB pieces or as forty 256 KB pieces).

Due to the nature of this approach, the download of any file can be halted at any time and be resumed at a later date, without the loss of previously downloaded information, which in turn makes BitTorrent particularly useful in the transfer of larger files. This also enables the client to seek out readily available pieces and download them immediately, rather than halting the download and waiting for the next (and possibly unavailable) piece in line, which typically reduces the overall time of the download. This eventual transition from peers to seeders determines the overall "health" of the file (as determined by the number of times a file is available in its complete form).

The distributed nature of BitTorrent can lead to a flood-like spreading of a file throughout many peer computer nodes. As more peers join the swarm, the likelihood of a successful download by any particular node increases. Relative to traditional Internet distribution schemes, this permits a significant reduction in the original distributor's hardware and bandwidth resource costs. Distributed downloading protocols in general provide redundancy against system problems, reduce dependence on the original distributor, and provide sources for the file which are generally transient and therefore there is no single point of failure as in one way server-client transfers.

Though both ultimately transfer files over a network, a BitTorrent download differs from a one way server-client download (as is typical with an HTTP or FTP request, for example) in several fundamental ways:

BitTorrent makes many small data requests over different IP connections to different machines, while server-client downloading is typically made via a single TCP connection to a single machine.

BitTorrent downloads in a random or in a "rarest-first" approach that ensures high availability, while classic downloads are sequential.

Taken together, these differences allow BitTorrent to achieve much lower cost to the content provider, much higher redundancy, and much greater resistance to abuse or to "flash crowds" than regular server software. However, this protection, theoretically, comes at a cost: downloads can take time to rise to full speed because it may take time for enough peer connections to be established, and it may take time for a node to receive sufficient data to become an effective uploader. This contrasts with regular downloads (such as from an HTTP server, for example) that, while more vulnerable to overload and abuse, rise to full speed very quickly, and maintain this speed throughout. In the beginning, BitTorrent's non-contiguous download methods made it harder to support "streaming playback". In 2014, the client Popcorn Time allowed for streaming of BitTorrent video files. Since then, more and more clients are offering streaming options.

### Downloading and sharing

Users find a torrent of interest on a torrent index site or by using a search engine built into the client, download it, and open it with a BitTorrent client. The client connects to the tracker(s) or seeds specified in the torrent file, from which it receives a list of seeds and peers currently transferring pieces of the file(s). The client connects to those peers to obtain the various pieces. If the swarm contains only the initial seeder, the client connects directly to it, and begins to request pieces. Clients incorporate mechanisms to optimize their download and upload rates.

## Creating and publishing

A BitTorrent user creates a torrent by generating a torrent file with a dedicated client or utility. This file contains metadata about the files to be shared, including file names, sizes, and piece length, along with the cryptographic hash of each piece to enable integrity checking during download.

### Magnet links

Magnet links allow users to obtain the necessary metadata for a torrent without downloading a separate torrent file. The v2 specification extends magnet links with a hybrid mode that includes both SHA-1 and SHA-256 info hashes, maintaining compatibility with legacy clients while enabling the security improvements of v2.

### Publishing a torrent

To publish a torrent, the creator uploads the .torrent file to a torrent index or distributes the magnet link. The creator must also seed the torrent by running a BitTorrent client that holds the complete set of files, enabling other peers to begin downloading. Peers discover each other through several standardized mechanisms: centralized trackers, distributed hash tables, and peer exchange.

## Seeding

In computing, and specifically peer-to-peer file sharing, seeding is the uploading of already downloaded content for others to download from. A peer, a computer that is connected to the network, becomes a seed when having acquired the entire set of data, it offers its upload bandwidth to other peers attempting to download the file. This data consists of small parts so that seeds can effectively share their content with other peers, handing out the missing pieces. A peer deliberately chooses to become a seed by leaving the upload task active once the content has downloaded. The motivation to seed is mainly to keep the file being shared in circulation (as there is no central hub to continue uploading in the absence of peer seeders) and a desire to not act as a parasite. The opposite of a seed is a leech, a peer that downloads more than they upload.

## Torrent file

In the BitTorrent file distribution system, a torrent file or meta-info file is a computer file that contains metadata about files and folders to be distributed, and usually also a list of the network locations of trackers, which are computers that help participants in the system find each other and form efficient distribution groups called swarms. Torrent files are normally named with the extension .torrent.

A torrent file acts like a table of contents (index) that allows computers to find information through the use of a torrent client. With the help of a torrent file, one can download small parts of the original file from computers that have already downloaded it. These "peers" allow for downloading of the file in addition to, or in place of, the primary server. A torrent file does not contain the content to be distributed; it only contains information about those files, such as their names, folder structure, sizes, and cryptographic hash values for verifying file integrity.

## Anonymity

BitTorrent does not, on its own, offer its users anonymity. One can usually see the IP addresses of all peers in a swarm in one's own client or firewall program. This may expose users with insecure systems to attacks. In some countries, copyright organizations scrape lists of peers, and send takedown notices to the Internet service provider (ISP) of users participating in the swarms of files that are under copyright. In some jurisdictions, copyright holders may launch lawsuits against uploaders or downloaders for infringement, and police may arrest suspects in such cases.

Virtual private networks encrypt transfers, and substitute a different IP address for the users, so that anyone monitoring a torrent swarm will only see that address.

## Legislation

Although the protocol itself is legal, problems stem from using the protocol to traffic copyright infringing works, since BitTorrent is often used to download otherwise paid content, such as movies and video games. There has been much controversy over the use of BitTorrent trackers. BitTorrent metafiles themselves do not store file contents. Whether the publishers of BitTorrent metafiles violate copyrights by linking to copyrighted works without the authorization of copyright holders is controversial. Various jurisdictions have pursued legal action against websites that host BitTorrent trackers.

As a result, the use of BitTorrent may sometimes be limited by ISPs due to legal or copyright grounds. Users may choose to run seedboxes or virtual private networks (VPNs) to circumvent these restrictions.

## Security

Several studies on BitTorrent from over a decade ago found files available for download containing malware. In particular, one small sample indicated that 18% of all executable programs available for download contained malware. Another study claims that as much as 14.5% of BitTorrent downloads contain "zero-day" malware not indexed by any antivirus, and that BitTorrent was used as the distribution mechanism for 47% of all zero-day malware they have found.

## Legal issues with BitTorrent

The use of the BitTorrent protocol for the unauthorized sharing of copyrighted content generated a variety of novel legal issues. While the technology and related platforms are legal in many jurisdictions, law enforcement and prosecutorial agencies are attempting to address this avenue of copyright infringement. Notably, the use of BitTorrent in connection with copyrighted material may make the issuers of the BitTorrent file, link or metadata liable as an infringing party under some copyright laws. Similarly, the use of BitTorrent to procure illegal materials could potentially create liability for end users as an accomplice.

## The BitTorrent Protocol Specification

BitTorrent is a protocol for distributing files. It identifies content
by URL and is designed to integrate seamlessly with the web. Its
advantage over plain HTTP is that when multiple downloads of the same
file happen concurrently, the downloaders upload to each other, making
it possible for the file source to support very large numbers of
downloaders with only a modest increase in its load.

### A BitTorrent file distribution consists of these entities

- An ordinary web server
- A static 'metainfo' file
- A BitTorrent tracker
- An 'original' downloader
- The end user web browsers
- The end user downloaders

There are ideally many end users for a single file.

### To start serving, a host goes through the following steps

1. Start running a tracker (or, more likely, have one running already).
1. Start running an ordinary web server, such as apache, or have one already.
1. Associate the extension .torrent with mimetype application/x-bittorrent on their web server (or have done so already).
1. Generate a metainfo (.torrent) file using the complete file to be served and the URL of the tracker.
1. Put the metainfo file on the web server.
1. Link to the metainfo (.torrent) file from some other web page.
1. Start a downloader which already has the complete file (the 'origin').

### To start downloading, a user does the following

1. Install BitTorrent (or have done so already).
1. Surf the web.
1. Click on a link to a .torrent file.
1. Select where to save the file locally, or select a partial download to resume.
1. Wait for download to complete.
1. Tell downloader to exit (it keeps uploading until this happens).
