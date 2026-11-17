---
name: dotnet
description: >
  Develop guideline for .NET (invoked as develop:dotnet). Rule set for writing new C#/.NET code (features,
  endpoints, handlers, workers, bug fixes) on any supported target (.NET 8, 9, 10, 11 / C# 12-15): detects the
  target framework and LangVersion and writes the idioms that version provides (Lock, params spans, extension
  members, field keyword, built-in validation, unions, closed hierarchies, ...). Rules: recipe-style
  orchestrators with max one indentation level, immutability, typed errors, CancellationToken everywhere, tests
  with every change, and for layered / DDD backends rules placed in the Domain, value objects, CanHandle
  strategies and conversion-operator mapping. Use when asked to implement, add, build, extend, or fix something
  in C#/.NET code. For behavior-preserving restructuring use refactor:dotnet; to retarget to a newer
  framework use migrate:dotnet. Not for project scaffolding, DB migrations, frontend code, or CI work.
---

# Develop: .NET

Act as a principal .NET engineer writing production code. New code is born in the shape `refactor:dotnet` would otherwise have to produce later, in the newest idioms the project's target framework and C# version allow.

**Before writing code read [references/versions.md](references/versions.md) and [references/rules.md](references/rules.md)**, then load the version packs `versions.md` selects. References:

- [references/versions.md](references/versions.md) — detect target / LangVersion, which packs to load, multi-targeting, support status.
- [references/net8.md](references/net8.md), [references/net9.md](references/net9.md), [references/net10.md](references/net10.md), [references/net11.md](references/net11.md) — per-version idioms: prefer, replace (old -> new), traps.
- [references/rules.md](references/rules.md) — version-neutral rule set (shared with `refactor:dotnet`).
- [references/clean-code.md](references/clean-code.md) — language-agnostic core rules.
- [references/code-shape.md](references/code-shape.md) — C# recipes: orchestrators, flattening, records, exceptions, async.
- [references/domain-model.md](references/domain-model.md) — aggregates, entities, value objects, domain services.
- [references/mapping-and-performance.md](references/mapping-and-performance.md) — conversion operators, spans, pooling.
- [references/layers-and-conventions.md](references/layers-and-conventions.md) — layer ownership, folders, naming, DI, controllers, logging, docs.
- [references/test-strategy.md](references/test-strategy.md) — tests for new code and bug fixes.
- [references/commit-hygiene.md](references/commit-hygiene.md) — branches, commit size and format, hand-off.

## Precedence

1. Explicit instructions in the task.
2. Conventions the target repository documents (`AGENTS.md`, `CLAUDE.md`, `README`, `docs/`, `.editorconfig`, `Directory.Build.props`, analyzers) or consistently follows in code.
3. The version packs for the target (they never override 1 or 2).
4. The other defaults in this skill.

Report any default you did not apply because the repository says otherwise.

## Workflow

1. **Discover** — solution file, projects and layers; per touched project `TargetFramework(s)`, effective `LangVersion`, `global.json`, and the packs this selects; test framework and mocking library; error style (exceptions, unions, result types); JSON, DI, logging and validation style; how errors become HTTP responses; where docs live. Read the docs and the **nearest existing feature of the same kind**; copy its shape, upgraded only to idioms the packs mark as preferred.
2. **Baseline** — `dotnet build <solution>` and `dotnet test <solution>`; record counts and pre-existing failures.
3. **Design** — in chat, briefly: types to add per layer, the domain rules and where they live, how outcomes are modeled (exceptions or unions, per the repository), contract changes (must be additive), tests to write. Ask before any breaking API / DB / file contract change or a new dependency.
4. **Implement inside-out** — Domain (entities, value objects, unions / closed hierarchies, exceptions, interfaces) -> Application (service, DTOs, operators) -> Infrastructure (adapters, `Add{Feature}()`) -> Presentation (endpoint / controller, outcome mapping). Non-layered code: types -> logic -> wiring. Tests alongside each piece; for a bug fix the failing reproduction test comes first.
5. **Verify** — build with no new warnings; all tests pass; test count = baseline + new tests.
6. **Docs** — update the docs and doc index for every unit added or changed, in the same change.
7. **Self-review** — run the Checklist; report unmet items.

## Non-negotiables (full text in rules.md and the packs)

- Use the newest idiom the loaded packs prefer; never an API or syntax the target / `LangVersion` lacks; never raise either; no preview features.
- Orchestrators are recipes; every method has at most one indentation level; no argument mutation; no business tuples.
- Layered code: business decisions live in Domain; entities change only through intent-named methods; meaningful primitives are wire-compatible value objects without implicit conversions.
- Closed sets of alternatives: unions / `closed` hierarchies with exhaustive switches on C# 15; open sets: `CanHandle` strategies.
- Typed errors mapped to transport in one place; one error style per feature; conversion operators on DTOs; no reflection mappers; one JSON library.
- `CancellationToken cancellationToken = default` on every async method, forwarded; no blocking calls.
- Existing contracts frozen; new fields and endpoints additive. DB changes go through the project's migration process: stop and say what is needed.

## Checklist

- [ ] Followed the shape of the nearest existing feature; repo conventions respected (conflicts reported).
- [ ] Target(s), LangVersion and loaded packs recorded; nothing above them used; multi-target code follows the lowest target.
- [ ] Preferred idioms from the packs used (e.g. `Lock`, `field`, extension members, built-in validation, unions) where the repository does not say otherwise.
- [ ] Each new type in the right layer; dependency flow intact; Domain free of infra / serialization / transport types.
- [ ] Business decisions in Domain; intent methods; read-only collections; value objects wire-compatible.
- [ ] Orchestrators are recipes; every method <= 1 indentation level; no argument mutation; no business tuples.
- [ ] Outcomes modeled in the repository's error style; switches exhaustive without `_`; central transport mapping.
- [ ] Conversion operators on DTOs; no reflection mappers; no new JSON library.
- [ ] `CancellationToken` on every async path; no blocking calls; structured logging.
- [ ] Tests for every new rule / branch / endpoint / union case; bug fixes start with a reproducing test; all green.
- [ ] Existing contracts unchanged; new ones additive.
- [ ] Docs and doc index updated; commits follow commit-hygiene (or the repository's rules).

## Final report

Discovery summary (one line each, with target / LangVersion / packs), what was added per layer, contract additions, tests before / after (counts), docs touched, unmet checklist items, defaults overridden by repository conventions, follow-ups (e.g. end-of-support target).
