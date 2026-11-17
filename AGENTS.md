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
- **Stack** = the technology family it applies to (`dotnet`, `react`, `dotnet-api`). No version in the name: version differences live in **version packs** (below), so one skill serves every supported version.
- Folder: `skills/<action>/<stack>/`. Frontmatter `name: <stack>` (lowercase letters, digits, hyphens; no colon). Claude Code exposes it as `<action>:<stack>`.
- Because the bare `name` loses the action outside Claude Code, start the `description` with "<Action> guideline for <stack> (invoked as <action>:<stack>)."
- When two skills cover neighboring scopes (`refactor:*` vs `develop:*`), each description names the other and says when to use it instead.

## Shared rules

- Layout: `shared/core/` (every stack), `shared/<stack-family>/` (e.g. `dotnet/`, `react/`).
- `shared/manifest.json` maps each skill folder to the shared files it receives. They are copied flat into `<skill>/references/`, so links inside a shared file are written as siblings (`rules.md`, not `../dotnet/rules.md`), relative to the destination.
- Generated copies start with a `GENERATED from shared/...` banner. Never edit them; edit the source and run `node scripts/sync-shared.mjs`.
- Move a rule into `shared/` as soon as a second skill needs it; keep stack-only recipes in the skill's own `references/`.

## Version packs

- A stack whose idioms change between releases gets a selector (`shared/<stack>/versions.md`: how to detect the target, which packs to load, multi-targeting, support table) and one pack per major version (`net8.md`, `net9.md`, ...).
- The base rules (`rules.md`) hold for the oldest supported version. A pack lists only what its release adds or changes, in three sections: **Prefer**, **Replace (old -> new)** (say when a swap is not behavior-preserving), **Traps**.
- Packs are cumulative: an agent loads every pack from the oldest up to the target.
- New release: add one pack, update the support table in the selector, bump the plugins. Never fork a skill per version.
- Facts in packs come from official release notes; verify API names before adding them.

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
