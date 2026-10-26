# Authoring guide for this repository

Rules for any agent (or human) adding or editing skills here.

## Principles

- **Project-agnostic.** A skill must work in any repository. No company, product, solution, namespace, path, branch, or domain model names from a specific codebase. Use placeholders (`{Company}.{Product}`, `<solution>`) and made-up illustrative names, and say they are illustrative.
- **Discover, then apply.** A skill tells the agent how to learn the target repository (structure, docs, conventions, commands) before acting, and states the precedence: task instructions > repository conventions > skill defaults.
- **Guidelines, not essays.** Imperative, short, checkable rules. Every rule should be verifiable in a review.
- **Progressive disclosure.** `SKILL.md` holds the workflow, the strongest rules and a checklist (aim for under ~200 lines). Long recipes and examples go in `references/*.md`, linked from `SKILL.md`.
- **One source per rule.** A rule used by more than one skill lives in `shared/` and is copied into each skill; never maintain two hand-written versions.
- **Self-contained folders.** A skill folder must work alone (zipped, copied). Links go only to files inside the skill folder or to external URLs.

## Naming: `<action>:<stack>`

- **Action** = verb for the kind of work (`refactor`, `develop`, `bootstrap`, `review`, `migrate`, ...). One plugin per action.
- **Stack** = what it applies to, including the major version when rules depend on it (`dotnet8`, `dotnet9-api`, `dotnet8-worker`, `react`).
- Folder: `skills/<action>/<stack>/`. Frontmatter `name: <stack>` (lowercase letters, digits, hyphens; no colon). Claude Code exposes it as `<action>:<stack>`.
- Because the bare `name` loses the action outside Claude Code, start the `description` with "<Action> guideline for <stack> (invoked as <action>:<stack>)."
- When two skills cover neighboring scopes (`refactor:*` vs `develop:*`, `dotnet` vs `dotnet8`), each description names the other and says when to use it instead.

## Shared rules

- Layout: `shared/core/` (every stack), `shared/<stack-family>/` (e.g. `dotnet/`, `dotnet8/`, `react/`).
- `shared/manifest.json` maps each skill folder to the shared files it receives. They are copied flat into `<skill>/references/`, so links inside a shared file are written as siblings (`rules.md`, not `../dotnet8/rules.md`), relative to the destination.
- Generated copies start with a `GENERATED from shared/...` banner. Never edit them; edit the source and run `node scripts/sync-shared.mjs`.
- Move a rule into `shared/` as soon as a second skill needs it; keep stack-only recipes in the skill's own `references/`.

## Adding a skill

1. Copy `template/SKILL.md` to `skills/<action>/<stack>/SKILL.md`. The folder name must equal the frontmatter `name`.
2. Write a `description` that says what the skill does **and when to use it** (trigger phrases) and when not to. This is what agents use to decide to load it.
3. Add the shared files it needs to `shared/manifest.json` and run `node scripts/sync-shared.mjs`. Add stack-only `references/` files and link each one from `SKILL.md`.
4. Register it in `.claude-plugin/marketplace.json`: append `"./skills/<action>/<stack>"` to the `skills` of the plugin named `<action>`, or, for a new action, add a plugin entry (`name: "<action>"`, `source: "./"`, `strict: false`, `skills: [...]`) and list the skill in its description.
5. Add a row to the Skills table in `README.md`.
6. Bump the action plugin's `version` when any of its skills changes (including a shared file it receives), and the marketplace `metadata.version` on every release.

## Before committing

- `node scripts/check.mjs` passes. It validates: marketplace JSON and paths, every skill registered under its action and listed in `README.md`, frontmatter keys / name / description opening, relative links, shared copies in sync, and `SKILL.md` length (warning).
- Leak check: put the names of the projects a skill was born in (one per line) in `.leakwords` at the repository root. The file is git-ignored; `check.mjs` fails if any word appears in a skill, shared file, template, `README.md` or `AGENTS.md`.
- `SKILL.md` frontmatter has only `name` and `description` (plus optional `license`, `allowed-tools`, `metadata`).
