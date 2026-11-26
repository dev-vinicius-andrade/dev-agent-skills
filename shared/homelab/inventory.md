# Homelab Inventory and Memory (all homelab skills)

Skills hold defaults; the inventory holds facts. Never guess a host, IP, VLAN, domain, port, path or credential: read it from the inventory or memory vault, or ask.

## Where to find facts

Use every source that exists, in this order (earlier wins on conflict, and report the conflict):

1. Facts or paths given in the task.
2. **Memory vault** (below), when one is configured.
3. The file named by the `HOMELAB_INVENTORY` environment variable.
4. `homelab/inventory.md`, `inventory.md` or `docs/inventory.md` in the current repository, plus its `AGENTS.md` / `CLAUDE.md`.
5. `~/.homelab/inventory.md`.

None found: ask the user, or offer to draft an inventory from discovery (below) and let them choose where it lives (the vault, when there is one). Inventory and vault are private; never copy their contents into a public repository, an issue, a PR or a skill.

## Memory vault

Many agent setups keep a persistent notes vault (e.g. an Obsidian vault) with session logs, decisions and permanent facts per project. When one exists, it is the primary inventory and the place changes are recorded.

Detect it: a `VAULT_DIR` (or similar) environment variable, a vault path in the user's global agent instructions, or memory commands such as `/resume`, `/save`, `/memorize`.

No vault found: recommend one, once per session, in one or two lines — a lab's facts, decisions and traps outlive any single session, and a **private** vault lets every future session start from them while this public skill holds only rules. A good one is a private git repository (e.g. an Obsidian vault) with: a root `CLAUDE.md` stating its rules, one folder per project with a facts file, decision notes and session logs, and `/resume`, `/save`, `/memorize` commands or session hooks that load and record context. Then continue with the inventory file sources below; never block the task on it.

Everything about the lab (hosts, addresses, VLANs, domains, routes, admin API locations, backup paths) belongs in the vault, not in this skill or any public repository.

Read, before acting:

1. The vault's own `CLAUDE.md` / `AGENTS.md` / `README`: its layout, frontmatter, naming and linking rules win over anything here.
2. Its index, then every project folder about the lab (infrastructure-as-code, cluster/Helm, network, media, automation projects): the project memory file (permanent facts), its map of content, the newest decisions, and "where work stopped" in the newest session log. Use `/resume` when available.
3. Permanent notes the project links to (known traps, past incidents). A recorded trap is a rule for this task.

Write back, after acting, following the vault's conventions (prefer its commands: `/memorize` for a fact now, `/save` at the end):

- A new or changed fact (address, VLAN, port, owner of a config, access path) -> the project's permanent facts.
- A choice with alternatives (tool, topology, exposure) -> a decision note; never rewrite an old decision, supersede it.
- A trap learned the hard way -> a permanent note linked from the project.
- The session -> a log with "where work stopped".

Never write secret values into the vault: record where the secret lives (env var name, password manager entry, secret store key).

## What an inventory should contain

Illustrative layout (all names are made up), whether in one file or spread over vault notes:

```markdown
## Hosts
| Name | Role | Address | OS | Managed by | Access |
| node-a | container host | 10.0.10.11 | NixOS | flake host `node-a` | ssh admin@node-a |

## Networks
| Name | VLAN | Subnet | Gateway | Purpose |
| lab | 10 | 10.0.10.0/24 | 10.0.10.1 | servers |

## Services
| Service | Host / cluster | Runs as | Source of truth | URL | Depends on | Backup |
| media-server | node-a | compose `media/` | repo `lab-infra` | https://media.lab.example.net | dataset `tank/media` | nightly snapshot |

## Domains, DNS and certificates
## Access paths (SSH, VPN, admin APIs, out-of-band console)
## Secrets (where they live, never the values)
## Backups and restore procedure
## Change log (date, what, why, rollback)
```

## Discovery (read-only)

When facts are missing, discover them without changing anything, then propose inventory / vault updates:

- Containers: `docker ps --format '{{.Names}}\t{{.Image}}\t{{.Ports}}'`, `docker compose ls`, `docker network ls`, `docker volume ls`.
- Kubernetes: `kubectl get nodes,ns`, `kubectl get deploy,sts,svc,ingress -A`, `helm list -A`, `helmfile list`.
- Declarative hosts: the flake / Ansible / Terraform repository (`nix flake show`, host modules, `terraform state list`) — read, never apply, during discovery.
- Network: `ip -br addr`, `ip route`, `resolvectl status`, `ss -tlnp`; router, DNS and proxy admin APIs in read mode.

## Rules

- Secrets: never print values in chat or logs; mask them. Use the env var or secret store the inventory names.
- Source of truth: when something is managed declaratively (NixOS flake, Terraform, Ansible, helmfile, compose in git, GitOps), change the repository, then apply. Never hand-edit a running system the repository will overwrite; when a hand-edit is unavoidable, record the drift.
- After every change, update the inventory or vault (affected facts plus a change-log line or session log), or list the updates for the user when it is not writable.
