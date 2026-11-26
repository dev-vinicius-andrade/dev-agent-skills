# Home Assistant Recipes

Entity and area names below are illustrative.

## Access

- Prefer an existing integration (an MCP server or a Home Assistant skill) or the REST / WebSocket API with a long-lived token from its secret location.
- Know the install type (HA OS, container, supervised): it decides how add-ons, backups and upgrades work.

## Configuration

- YAML in git when the instance uses it (`configuration.yaml`, `packages/`, `automations.yaml`); secrets in `secrets.yaml`, git-ignored.
- Validate before restart: `ha core check` (HA OS / supervised) or Developer Tools -> YAML -> Check configuration; reload only the affected domain (automations, scripts, templates) instead of a full restart.
- Entity IDs and names: `<domain>.<area>_<thing>` (e.g. `light.kitchen_ceiling`); rename in the UI so references update, then search configuration for the old ID.

## Automations

- State trigger, condition, action, `mode` set deliberately (`single`, `restart`, `queued`).
- Test with the automation's trace and with `automation.trigger` only when its actions are harmless; otherwise test conditions with templates in Developer Tools.
- Automations touching locks, alarms, garage doors, heating, sirens or power switches: show the full YAML and get a yes before enabling; add a notification action.
- Keep one automation per behavior; record intent in its `description`.

## Upgrades

1. Read the release notes' breaking changes for every version crossed and check which integrations are used.
2. Full backup, stored off the HA host.
3. Upgrade core; then add-ons / custom components (HACS) one at a time.
4. Check Settings -> Repairs and logs; run the key automations' traces.
5. Rollback: restore the backup.

## Traps

- Restarting HA drops automations in flight and may re-fire `homeassistant.start` triggers.
- Custom components break more often than core on upgrades; check their compatibility first.
- Exposing HA remotely: through homelab:network rules (VPN or proxy with TLS, trusted proxies configured), never a raw port forward.
