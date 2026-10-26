# agent-skills

A marketplace of agent skills: opinionated, project-agnostic guidelines that tell coding agents **how** to do a kind of work (refactor, develop) the way I want it done, in any repository.

Every skill is a plain folder with a `SKILL.md`, so it works with Claude Code, the Claude apps, and any other agent that can read Markdown instructions.

## Naming: `<action>:<stack>`

Skills are grouped by **action**; each action is one plugin, each stack-specific skill lives inside it.

| Invoked as | Plugin (action) | Skill (stack) | Folder |
| --- | --- | --- | --- |
| `refactor:dotnet` | `refactor` | `dotnet` | `skills/refactor/dotnet/` |
| `refactor:dotnet8` | `refactor` | `dotnet8` | `skills/refactor/dotnet8/` |
| `refactor:react` | `refactor` | `react` | `skills/refactor/react/` |
| `develop:dotnet8` | `develop` | `dotnet8` | `skills/develop/dotnet8/` |
| `develop:react` | `develop` | `react` | `skills/develop/react/` |
| `bootstrap:dotnet9-api` *(planned)* | `bootstrap` | `dotnet9-api` | `skills/bootstrap/dotnet9-api/` |
| `bootstrap:dotnet8-worker` *(planned)* | `bootstrap` | `dotnet8-worker` | `skills/bootstrap/dotnet8-worker/` |

## Skills

| Skill | What it guides | Path |
| --- | --- | --- |
| `refactor:dotnet` | Version-agnostic C#/.NET refactoring: decoupling, logging, patterns, phased plan, test safety net | [skills/refactor/dotnet](skills/refactor/dotnet/SKILL.md) |
| `refactor:dotnet8` | Behavior-preserving refactoring of layered/DDD .NET 8 backends | [skills/refactor/dotnet8](skills/refactor/dotnet8/SKILL.md) |
| `refactor:react` | Behavior-preserving React and TypeScript refactoring, React 19 features when supported | [skills/refactor/react](skills/refactor/react/SKILL.md) |
| `develop:dotnet8` | New features and fixes in layered/DDD .NET 8 backends, same rules as `refactor:dotnet8` | [skills/develop/dotnet8](skills/develop/dotnet8/SKILL.md) |
| `develop:react` | New React/TypeScript components, hooks and features, same references as `refactor:react` | [skills/develop/react](skills/develop/react/SKILL.md) |

Which one?

- Changing structure without changing behavior: `refactor:*`. Adding or fixing behavior: `develop:*`.
- .NET 8 layered / DDD backend: `*:dotnet8`. Any other .NET code: `refactor:dotnet`.
- React / TypeScript: `*:react`.

## Install

### Claude Code (plugin marketplace)

```text
/plugin marketplace add dev-vinicius-andrade/agent-skills
/plugin install refactor@dev-agent-skills
/plugin install develop@dev-agent-skills
```

Installing a plugin installs every skill of that action (e.g. all `refactor:*` skills). Invoke `/refactor:dotnet8`, `/develop:dotnet8`, ..., or let the agent pick a skill from its description.

Update later with `/plugin marketplace update dev-agent-skills`.

### Claude apps

Zip a skill folder (e.g. `skills/refactor/dotnet8/`) and upload it under **Settings → Capabilities → Skills**. Each folder is self-contained: shared rules are already copied into its `references/`.

### Other agents

Copy or symlink the skill folder into wherever your agent loads instructions from, or reference its `SKILL.md` from your project's `AGENTS.md`:

```markdown
When refactoring .NET code, follow `path/to/agent-skills/skills/refactor/dotnet8/SKILL.md`.
```

## How skills behave in a project

Skills hold defaults, not project facts. Each one starts by discovering the target repository (solution, layers, docs, existing conventions) and applies this precedence:

1. Explicit instructions in the task.
2. Conventions the repository documents (`AGENTS.md`, `CLAUDE.md`, `README`, `docs/`, `.editorconfig`, ...).
3. The skill's defaults.

## Shared rules

Rules used by more than one skill have one source in `shared/` and are copied into each skill's `references/` by a script, so skills stay portable while rules never drift:

| Source | Used by |
| --- | --- |
| `shared/core/clean-code.md` | every skill: recipe functions, one nesting level, immutability, names, typed errors |
| `shared/core/commit-hygiene.md` | every skill: branches, commit size and format, hand-off |
| `shared/dotnet/test-strategy.md` | all .NET skills |
| `shared/dotnet8/*.md` | `refactor:dotnet8`, `develop:dotnet8` (rules, code shape, domain model, mapping and performance, layers) |
| `shared/react/*.md` | `refactor:react`, `develop:react` (hooks and state, patterns, React 19 features, anti-patterns) |

`shared/manifest.json` lists which sources go to which skill. Edit the source, never a generated copy, then:

```bash
node scripts/sync-shared.mjs
```

## Repository layout

```text
.claude-plugin/marketplace.json      marketplace catalog (one plugin per action)
skills/<action>/<stack>/SKILL.md     skill entry point (frontmatter + workflow + checklist)
skills/<action>/<stack>/references/  recipes loaded on demand (own files + generated shared copies)
shared/                              single source for rules used by several skills
shared/manifest.json                 which shared files each skill receives
scripts/sync-shared.mjs              copies shared/ into skills (--check to verify)
scripts/check.mjs                    validates catalog, frontmatter, links, README, sync
template/SKILL.md                    starting point for a new skill
AGENTS.md                            rules for adding or editing skills
```

## Contributing

See [AGENTS.md](AGENTS.md). Before committing:

```bash
node scripts/check.mjs
```
