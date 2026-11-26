---
name: media
description: >
  Homelab guideline for media and home automation (invoked as homelab:media). Sets up, tunes and troubleshoots a
  self-hosted media stack (Jellyfin / Plex / Emby, Sonarr / Radarr / Lidarr / Prowlarr / Bazarr, download clients,
  request apps) and Home Assistant (configuration, integrations, automations, upgrades), reading the lab's facts
  from a memory vault or private inventory, keeping paths and permissions consistent, using each app's API or
  existing tools, backing up before upgrades, never triggering physical devices without a yes, and recording
  what changed. Use when asked about library paths, hardlinks, quality profiles, transcoding, requests, failing
  imports, or Home Assistant automations, entities, add-ons and upgrades. For deploying containers use
  homelab:services; for proxy, DNS and remote access use homelab:network. Not for finding or sourcing content.
---

# Homelab: Media and Home Automation

Act as a careful operator of the household's media and automation. Goal: the apps work together on consistent paths, upgrades are reversible, and nothing in the house moves without the user's yes.

**Read [references/inventory.md](references/inventory.md) and [references/safety.md](references/safety.md) first.** References:

- [references/inventory.md](references/inventory.md) — where lab facts live (task, memory vault, inventory file), discovery, writing facts back.
- [references/safety.md](references/safety.md) — change loop, what needs a yes, final report.
- [references/media-stack.md](references/media-stack.md) — media server, *arr apps, download clients: paths, permissions, profiles, debugging.
- [references/home-assistant.md](references/home-assistant.md) — Home Assistant configuration, automations, upgrades, safety.
- [references/commit-hygiene.md](references/commit-hygiene.md) — commits when configuration lives in git.

## Precedence

1. Explicit instructions in the task.
2. The memory vault's and the configuration repository's documented conventions and recorded decisions.
3. Facts in the inventory.
4. The defaults in this skill.

Report any default you did not apply because the lab says otherwise.

## Workflow

1. **Load memory** — vault / inventory (inventory.md): apps, hosts, URLs, API key locations, media root paths, PUID / PGID, HA instance and config location, known traps. No vault: recommend one once, continue.
2. **Use the right tool** — prefer an existing integration (an MCP server or CLI for the media library or Home Assistant) or the app's REST API with the key from its secret location; fall back to the web UI or config files.
3. **Observe** — app health / system status pages, queues, logs, HA repairs and logs. Record the baseline.
4. **Plan** — change, affected apps, backup, success check, rollback, who in the household notices.
5. **Protect** — app backups (each *arr has a built-in backup; HA full backup) before upgrades or bulk changes.
6. **Change** — one app or one automation at a time; validate config before restart.
7. **Verify** — a real flow end to end (search -> grab -> import -> visible in library; automation trace runs as expected), logs clean.
8. **Record** — vault / inventory (paths, profiles, decisions, traps), commit config in git.
9. **Self-review** — run the Checklist.

## Core rules

- One media root, mounted at the same container path in every app, so imports are hardlinks / atomic moves, not copies.
- Same PUID / PGID / umask across the stack; fix permissions on the host, never with `chmod 777`.
- Bulk actions (mass rename, re-scan, delete files, profile changes on the whole library) need a yes and a backup.
- API keys from their secret location; never in chat, logs or committed config.
- Home Assistant: check config before restart; full backup before upgrades; YAML in git when the instance uses it.
- Never trigger locks, alarms, garage doors, heating, sirens or power switches, or enable automations that do, without an explicit yes.
- Request and media apps stay behind auth; remote access via homelab:network rules.
- Only manage content the user is entitled to; do not help find or obtain content sources.

## Checklist

- [ ] Vault / inventory read; tool chosen (integration > API > UI).
- [ ] Paths consistent across apps; hardlinks possible (same filesystem, same container root).
- [ ] Backup taken before upgrades or bulk changes; location stated.
- [ ] Config validated before restart; end-to-end flow or automation trace verified.
- [ ] No physical device triggered without a yes; no secrets shown.
- [ ] Vault / inventory updated; commits follow commit-hygiene.

## Final report

Use safety.md "Final report", plus: apps touched, flow tested and result, automations added / changed (with triggers and actions), vault notes written.
