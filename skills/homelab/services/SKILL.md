---
name: services
description: >
  Homelab guideline for services (invoked as homelab:services). Deploys, updates, debugs and removes self-hosted
  services on Docker / Docker Compose / Portainer stacks and Kubernetes (k3s, Helm, helmfile, GitOps), reading the
  lab's facts from a memory vault or private inventory, changing the source-of-truth repository first, pinning
  versions, backing up data before changes, verifying health and recording what changed. Use when asked to add,
  deploy, upgrade, restart, migrate, troubleshoot or remove a container, stack, chart or app in a homelab or
  self-hosted setup. For DNS, reverse proxy, TLS, VPN or firewall work use homelab:network; for the media stack and
  home automation use homelab:media. Not for application code (use develop:*) or hypervisor / bare-metal installs.
---

# Homelab: Services

Act as a careful homelab operator. Goal: the service runs from its source of truth, on a pinned version, with data backed up, health verified, and the lab's memory updated.

**Read [references/inventory.md](references/inventory.md) and [references/safety.md](references/safety.md) first.** References:

- [references/inventory.md](references/inventory.md) — where lab facts live (task, memory vault, inventory file), discovery, writing facts back.
- [references/safety.md](references/safety.md) — observe / plan / protect / change / verify / record loop, what needs a yes, lockout prevention.
- [references/compose.md](references/compose.md) — Docker Compose and Portainer recipes: file shape, updates, rollback, debugging.
- [references/kubernetes.md](references/kubernetes.md) — Kubernetes, Helm, helmfile and GitOps recipes.
- [references/commit-hygiene.md](references/commit-hygiene.md) — commits in the infrastructure repository.

## Precedence

1. Explicit instructions in the task.
2. The memory vault's and the infrastructure repository's documented conventions and recorded decisions.
3. Facts in the inventory.
4. The defaults in this skill.

Report any default you did not apply because the lab says otherwise.

## Workflow

1. **Load memory** — find the vault / inventory (inventory.md). Read the relevant project facts, newest decisions, last session state and linked traps. No vault: recommend one once, continue.
2. **Locate the service** — host or cluster, how it runs (compose project, Portainer stack, Helm release, NixOS module), source of truth (repository + path), data locations, dependencies (DB, storage, proxy routes, DNS names).
3. **Observe** — current version, health, logs, resource use. Record the healthy baseline.
4. **Plan** — in chat: change, blast radius, backup, success check, rollback command, user-visible downtime. Ask first for anything in safety.md "Ask before".
5. **Protect** — snapshot / back up volumes, PVCs, databases and config the change touches.
6. **Change** — edit the source of truth, review the diff (`docker compose config`, `helm diff`, `helmfile diff`, `nix build` / dry-activate), apply, one service at a time.
7. **Verify** — container / pod healthy, endpoint answers through its real route, logs clean, dependents still work.
8. **Record** — commit the repository change, update vault / inventory (facts, decision, trap, session log).
9. **Self-review** — run the Checklist.

## Core rules

- Change the source of truth, then apply. Never hand-edit what a repository, flake or GitOps controller will overwrite.
- Pin image tags or chart versions (digest when the repository does); upgrade by changing the pin, so rollback is the old pin.
- Read upstream release notes for every version crossed; major versions and database schema changes need a yes and a backup.
- Data lives in named volumes, bind mounts or PVCs listed in the inventory with a backup; never in a container's writable layer.
- Every service: healthcheck, restart policy, resource limits where the platform supports them, logs to stdout.
- Secrets come from the lab's secret mechanism (env file outside git, SOPS, sealed secrets, secret store), never plain text in the repository or chat.
- No new public exposure, Docker socket mount, privileged mode or host network without saying why and getting a yes.
- Removing a service: stop it, keep its data until the user confirms deletion, remove routes / DNS / monitoring that point to it.

## Checklist

- [ ] Vault / inventory read; relevant facts, decisions and traps applied (or "none recorded").
- [ ] Source of truth identified and changed; diff reviewed before apply.
- [ ] Version pinned; release notes for crossed versions checked.
- [ ] Data backed up before a change that can touch it; backup location stated.
- [ ] Health verified through the real route; dependents checked.
- [ ] Rollback command stated and valid.
- [ ] No secrets printed or committed; no unapproved exposure or privilege.
- [ ] Vault / inventory updated (or updates listed); commits follow commit-hygiene.

## Final report

Use safety.md "Final report", plus: service, platform and source-of-truth path; version before -> after; vault notes written.
