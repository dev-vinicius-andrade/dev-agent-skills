---
name: dotnet
description: >
  Migrate guideline for .NET (invoked as migrate:dotnet). Retargets C#/.NET solutions to a newer framework
  (e.g. net8.0 or net9.0 to net10.0 or net11.0): inventories SDK, target frameworks, packages, containers and
  CI, reads the version packs between the current and the target version (breaking changes, traps, old -> new
  idioms), upgrades leaf projects first, fixes the build against documented breaking changes, proves behavior
  and contracts unchanged with tests, and only then optionally adopts new idioms one per commit. Use when asked
  to upgrade, retarget, migrate, or move a .NET project to a newer .NET / C# version, or when a target is past
  end of support. For refactoring on the current target use refactor:dotnet; for new features use
  develop:dotnet. Not for .NET Framework to .NET ports, database migrations, or rewrites between frameworks.
---

# Migrate: .NET

Act as a principal .NET engineer upgrading a codebase. Goal: the solution runs on the target framework with **no observable behavior or contract change**; adopting new idioms is a separate, optional phase.

**Read [references/versions.md](references/versions.md) and [references/upgrade-steps.md](references/upgrade-steps.md) first**, then every version pack above the current target up to the new one. References:

- [references/upgrade-steps.md](references/upgrade-steps.md) — inventory, target choice, SDK / build files, packages, containers / CI, build fixes, verification, rollback.
- [references/versions.md](references/versions.md) — detecting targets, cumulative packs, multi-targeting, support status.
- [references/net8.md](references/net8.md), [references/net9.md](references/net9.md), [references/net10.md](references/net10.md), [references/net11.md](references/net11.md) — per version: Prefer, Replace (old -> new), Traps.
- [references/rules.md](references/rules.md), [references/clean-code.md](references/clean-code.md), [references/code-shape.md](references/code-shape.md) — rules any code fix must still follow.
- [references/mapping-and-performance.md](references/mapping-and-performance.md), [references/domain-model.md](references/domain-model.md), [references/layers-and-conventions.md](references/layers-and-conventions.md) — context for fixes in layered code.
- [references/test-strategy.md](references/test-strategy.md) — baseline, characterization tests, Go / No-Go.
- [references/commit-hygiene.md](references/commit-hygiene.md) — branches, commit size and format, hand-off.

## Precedence

1. Explicit instructions in the task (target version, scope, what may break).
2. Conventions the repository documents (`AGENTS.md`, `CLAUDE.md`, `README`, `docs/`, `Directory.Build.props`, CI files) or consistently follows.
3. The version packs and official breaking-change notes for each crossed version.
4. The other defaults in this skill.

Report any default you did not apply because the repository says otherwise.

## Workflow

1. **Inventory** — build the Migration Profile (upgrade-steps.md): targets per project, `LangVersion`, `global.json`, central packages, framework-coupled and third-party packages, vulnerable / deprecated packages, containers, CI, hosting, package consumers, tools.
2. **Choose the target** — the task's target, else the newest LTS. List the crossed versions (current + 1 ... target) and load their packs. State end-of-support facts.
3. **Baseline** — on the current target: `dotnet build <solution>` and `dotnet test <solution>`; record counts. Add characterization tests for areas the crossed packs flag (conversions, serialization, compression, dates, OpenAPI, status codes). Snapshot contracts (DTO JSON, OpenAPI documents).
4. **Plan** — phased plan in chat: order of projects (leaf first), package moves, Traps that apply to this codebase (with files), container / CI / hosting changes, risk per phase, rollback. Ask before dropping a framework consumers still use or accepting any contract diff.
5. **Execute** — Phase order below, one phase per commit (or short series), never mixed.
6. **Verify** — after every phase: build with no new warnings (or each new one handled with a reason), tests green with count >= baseline, contract snapshots identical.
7. **Modernize (optional)** — only if the task asks or allows it: behavior-preserving Replace rows from the crossed packs, one idiom per commit, in scope only. Everything else becomes a follow-up list.
8. **Self-review** — run the Checklist; report unmet items.

### Phase order

1. Characterization tests and contract snapshots on the current target.
2. SDK: `global.json`, CI SDK versions, local tool versions.
3. Target frameworks: leaf projects -> hosts (test projects with their subjects); multi-target published libraries.
4. Framework-coupled packages to the matching major; vulnerable / unsupported third-party packages, one family per commit.
5. Build fixes: compile errors, then new warnings, then test failures — each traced to a pack Trap or documented breaking change.
6. Containers, hosting settings, deployment baselines.
7. Optional modernization from the crossed packs.

## Non-negotiables

- Never skip a crossed version's pack; a multi-version jump applies every Trap in between.
- No behavior or contract change: API JSON, routes, OpenAPI documents, DB schema, stored files, HTTP outcomes. Pin options (e.g. OpenAPI version, JSON options) to keep old output unless the task accepts the change.
- No preview features, no `LangVersion preview`, no runtime opt-ins the repository did not already use.
- Fix breaking changes with the documented fix, never by suppressing warnings wholesale or pinning to an unsupported package.
- Keep upgrade and modernization in separate commits; never refactor structure during a migration.
- Code fixes follow rules.md (recipes, one nesting level, typed errors, `CancellationToken`).

## Checklist

- [ ] Migration Profile recorded; target chosen and justified; crossed versions and packs listed.
- [ ] Baseline green on the old target; characterization tests and contract snapshots added.
- [ ] `global.json`, CI and tools on the target SDK; targets changed where the repository centralizes them.
- [ ] Framework-coupled packages on the matching major; no unsupported or vulnerable package left without a note.
- [ ] Every applicable Trap from each crossed pack checked against the codebase (applied or "not affected").
- [ ] Build clean or each new warning handled with a reason; test count >= baseline; tests unedited except framework-required.
- [ ] Contract snapshots identical (or the diff explicitly approved).
- [ ] Containers keep their image family / variant; hosting changes and hardware baselines reported.
- [ ] Modernization, if any, behavior-preserving, one idiom per commit; the rest listed as follow-ups.
- [ ] Commits follow commit-hygiene (or the repository's rules); one phase per commit.

## Final report

Migration Profile (before -> after per project), crossed versions and the Traps that applied, packages changed (old -> new), build fixes with the breaking change each answers, tests before / after, contract snapshot result, infrastructure changes needed outside the repository, modernizations done, follow-ups grouped by pack, unmet checklist items.
