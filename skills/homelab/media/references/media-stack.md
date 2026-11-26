# Media Stack Recipes

Paths and names below are illustrative.

## Chain

Request app -> *arr (Sonarr TV, Radarr movies, Lidarr music, Bazarr subtitles) -> indexer manager (Prowlarr) -> download client -> *arr import -> media server library (Jellyfin / Plex / Emby).

Know each link's URL and API key location from the inventory. Connect apps by container / service name on a shared internal network, not through the public proxy.

## Paths (the most common failure)

```text
host:  /tank/data/{downloads/{tv,movies},media/{tv,movies}}
every container mounts: /tank/data -> /data
download client saves to:  /data/downloads/tv
*arr root folder:          /data/media/tv
media server library:      /data/media/tv
```

- One mount of the common parent in every container: imports become hardlinks (instant, no double space).
- Separate mounts for `downloads` and `media` break hardlinks even on the same disk.
- When the download client reports a path the *arr cannot see, fix the mounts; use Remote Path Mappings only for a client on another host.

## Permissions

- Same `PUID` / `PGID` and `UMASK=002` everywhere; one group owns the data tree with setgid on directories.
- Diagnose: `ls -ln` on the host path vs `id` inside the container.

## Profiles and naming

- Change quality profiles and naming per app, preview the rename list before applying, and ask before applying to the whole library.
- Record the chosen profiles and naming scheme in the vault as a decision.

## Media server

- Hardware transcoding: pass the GPU device (`/dev/dri`) to the container and enable it in the server; verify with a forced transcode and the server's dashboard.
- Libraries point to `/data/media/...`; scans after imports via the *arr connection, not frequent full scans.

## Upgrades and backups

- Each *arr: System -> Backup (or API) before upgrades; keep the backup outside the container volume.
- Pin image tags; upgrade one app at a time; check System -> Status / Health after.

## Debugging

- Stuck queue: download client reachable? category / label matches? path visible inside the *arr container?
- Import fails: permissions, path mapping, sample / extension filters, free space.
- Indexer errors: Prowlarr app sync and indexer health pages; never paste indexer credentials into chat.
