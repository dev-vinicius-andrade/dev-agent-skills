<!-- GENERATED from shared/homelab/safety.md by scripts/sync-shared.mjs. Edit the source, then re-run the script. -->

# Change Safety for Live Systems (all homelab skills)

A homelab is production for the people who live with it. Every change follows this loop.

## The loop

1. **Observe** — read-only first: current state, config, logs, health. Record what "healthy" looks like (status, endpoints answering, key metrics).
2. **Plan** — state the change, the blast radius (what else breaks if this fails), the check that proves success, and the rollback.
3. **Protect** — backup or snapshot whatever the change can destroy: config file copy, volume / dataset snapshot, VM snapshot, exported dashboard, DNS zone export.
4. **Change** — one change at a time, smallest step that can be verified.
5. **Verify** — run the success check. Failed or unclear: roll back, then investigate.
6. **Record** — update the inventory and its change log (inventory.md).

## Ask before

Confirm in chat, with what will happen, before:

- Deleting or recreating anything holding data: volumes, datasets, PVCs, databases, media folders, VM disks.
- Restarting or stopping a host, hypervisor, router, firewall, DNS server, storage server, or anything others depend on.
- Exposing a service outside the LAN (port forward, public DNS record, tunnel, public ingress) or loosening auth on one.
- Changing firewall, VPN, SSH, or router config that the current access path relies on.
- Upgrades across a major version, or any upgrade whose notes list a breaking change.
- Actions with physical effect: locks, alarms, garage doors, heating, power switches.

## Never

- Never open admin interfaces (hypervisor, router, NAS, Docker socket, databases, Home Assistant without auth) to the internet.
- Never mount the Docker socket into a container without saying why and offering a socket proxy.
- Never use `latest` or floating tags for something you are about to upgrade; pin the version so rollback has a target.
- Never run destructive cleanups wholesale (`docker system prune -a --volumes`, `kubectl delete ns`, `zfs destroy -r`, `rm -rf` on mounts). Target the exact item and confirm.
- Never disable a security control (auth, TLS, firewall rule, fail2ban, CrowdSec, ACL) to make something work. Find the cause.
- Never store secrets in a repository in plain text; use the repository's secret mechanism (env file outside git, SOPS, sealed secrets, a secret store).

## Lockout prevention

For changes that can cut your own access (network, firewall, SSH, VPN):

- Keep the current session open and test from a **second** session before closing the first.
- Know the out-of-band path (console, IPMI, physical access) and write it in the inventory.
- Arm an automatic revert before risky remote changes (e.g. schedule a restore of the old config in 5 minutes, cancel it once the new one is verified).

## Maintenance timing

- Prefer times when nobody is streaming, working or relying on automations; say when a change interrupts users.
- Do not start a long migration or upgrade you cannot finish or roll back in the same sitting.

## Final report (every homelab task)

What changed (host, service, file), backups taken and where, checks run and results, rollback command, inventory updates made or pending, anything left unverified.
