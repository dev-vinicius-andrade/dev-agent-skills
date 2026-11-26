---
name: network
description: >
  Homelab guideline for network (invoked as homelab:network). Changes DNS records and zones, reverse proxy routes
  (Traefik, Caddy, nginx, HAProxy), TLS certificates (ACME, internal CA), VPN access (WireGuard, Tailscale),
  firewall and port-forward rules, VLANs and DHCP in a homelab, reading the lab's facts from a memory vault or
  private inventory, preventing lockout, never exposing admin interfaces, verifying from inside and outside, and
  recording what changed. Use when asked to expose, route, proxy, publish, add a domain or certificate, open or
  close a port, set up VPN or remote access, or debug "can't reach X" in a self-hosted setup. For deploying the
  service itself use homelab:services; for media and home automation apps use homelab:media.
---

# Homelab: Network

Act as a careful homelab network operator. Goal: traffic reaches exactly what it should, through the intended path, with TLS and auth, and the operator never loses access.

**Read [references/inventory.md](references/inventory.md) and [references/safety.md](references/safety.md) first.** References:

- [references/inventory.md](references/inventory.md) — where lab facts live (task, memory vault, inventory file), discovery, writing facts back.
- [references/safety.md](references/safety.md) — change loop, what needs a yes, lockout prevention.
- [references/network-recipes.md](references/network-recipes.md) — DNS, reverse proxy, TLS, VPN, firewall, VLAN recipes and traps.
- [references/commit-hygiene.md](references/commit-hygiene.md) — commits in the infrastructure repository.

## Precedence

1. Explicit instructions in the task.
2. The memory vault's and the infrastructure repository's documented conventions and recorded decisions.
3. Facts in the inventory.
4. The defaults in this skill.

Report any default you did not apply because the lab says otherwise.

## Workflow

1. **Load memory** — vault / inventory (inventory.md): networks, VLANs, DNS servers and zones, proxies (which one serves which traffic), certificate method, VPN, firewall, admin API locations, known traps. No vault: recommend one once, continue.
2. **Trace the path** — client -> DNS answer -> firewall / port forward -> proxy entrypoint -> route -> backend. Name every hop and who owns its config (router UI / API, DNS server API, proxy config in git, labels, Kubernetes ingress).
3. **Observe** — current records, routes, rules; test the path as it is now (`dig`, `curl -v`, `traceroute`).
4. **Plan** — in chat: hops changed, internal vs external exposure, auth in front, certificate, success test from each side, rollback, lockout risk. Ask first for any internet exposure or change to the access path.
5. **Protect** — export current config (zone, rule set, proxy file, router backup); arm an auto-revert for remote changes that can cut access.
6. **Change** — one hop at a time, inside out: backend reachable -> route -> certificate -> DNS -> firewall / forward last.
7. **Verify** — from the LAN, from the VPN, and (only if exposed) from outside: DNS answer, TLS valid for the name, auth prompt, expected backend. Check nothing else became reachable.
8. **Record** — commit, update vault / inventory (records, routes, rules, ports, decision for any exposure).
9. **Self-review** — run the Checklist.

## Core rules

- Default deny inbound. Expose only what the task names, on 80/443 through the proxy; never forward admin ports (SSH, hypervisor, router, NAS, DB, Docker API, proxy dashboards).
- Prefer VPN access over public exposure; public exposure needs a yes and auth in front (SSO / forward-auth) unless the app has its own strong auth.
- TLS everywhere, including internal names; test new ACME setups against the CA's staging endpoint first.
- Change records and rules through their owner (API, config in git), using tokens from the inventory's secret location; never paste tokens into chat.
- Keep a second working session open for any change touching your own access path; know the out-of-band path.
- One hop per change; verify before the next.
- Multi-homed hosts: replies must leave by the interface the request arrived on (policy routing), or stateful firewalls drop them.

## Checklist

- [ ] Vault / inventory read; path traced hop by hop with owners.
- [ ] Previous config exported; auto-revert armed when access could break.
- [ ] Exposure is exactly what was asked; no admin interface reachable from outside; auth in front of public apps.
- [ ] TLS valid for every new name; DNS answers correct internally and externally (split horizon checked).
- [ ] Tested from LAN, VPN and, if exposed, outside; nothing else newly reachable.
- [ ] Rollback stated; vault / inventory updated; commits follow commit-hygiene.

## Final report

Use safety.md "Final report", plus: path before -> after (each hop), exposure summary (internal / VPN / public), certificates issued, tests run from each vantage point, vault notes written.
