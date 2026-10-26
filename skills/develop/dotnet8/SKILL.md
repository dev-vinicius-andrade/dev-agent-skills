---
name: dotnet8
description: >
  Develop guideline for .NET 8 (invoked as develop:dotnet8). Rule set for writing new code (features,
  endpoints, handlers, bug fixes) in a C# .NET 8 backend organized in layers (Domain, Application,
  Infrastructure, Presentation / DDD / onion / clean architecture): rules placed in the Domain, recipe-style
  orchestrators with max one indentation level, immutability, value objects, typed domain exceptions, CanHandle
  strategies, conversion-operator mapping, CancellationToken everywhere, tests with every change. Use when asked
  to implement, add, build, extend, or fix something in a .NET 8 backend. For behavior-preserving restructuring
  use refactor:dotnet8 instead. Not for project scaffolding, DB migrations, frontend code, or CI work.
---

# Develop: .NET 8

Act as a principal .NET engineer writing production code for **.NET 8 / C# 12**. New code is born in the shape `refactor:dotnet8` would otherwise have to produce later. Project-agnostic and self-contained.

**Read [references/rules.md](references/rules.md) before writing code.** It is the full rule set shared with `refactor:dotnet8`. Recipes, loaded when needed:

- [references/clean-code.md](references/clean-code.md) — language-agnostic core rules.
- [references/code-shape.md](references/code-shape.md) — C# recipes: orchestrators, flattening, records, exceptions, async.
- [references/domain-model.md](references/domain-model.md) — aggregates, entities, value objects, domain services, layout.
- [references/mapping-and-performance.md](references/mapping-and-performance.md) — conversion operators, spans, pooling.
- [references/layers-and-conventions.md](references/layers-and-conventions.md) — layer ownership, folders, naming, DI, controllers, logging, docs.
- [references/test-strategy.md](references/test-strategy.md) — what to test for new code and bug fixes.
- [references/commit-hygiene.md](references/commit-hygiene.md) — branches, commit size and format, hand-off.

## Precedence

1. Explicit instructions in the task.
2. Conventions the target repository documents (`AGENTS.md`, `CLAUDE.md`, `README`, `docs/`, `.editorconfig`, `Directory.Build.props`, analyzers) or consistently follows in code.
3. The defaults in this skill.

Report any default you did not apply because the repository says otherwise.

## Workflow

1. **Discover** — solution file, projects per layer, `TargetFramework` (assume `net8.0`; no .NET 9+ APIs), test framework and mocking library, JSON library, DI and logging style, how errors become HTTP responses, where docs live. Read the docs and the **nearest existing feature of the same kind**; copy its shape.
2. **Baseline** — `dotnet build <solution>` and `dotnet test <solution>`; record counts and any pre-existing failures.
3. **Design** — in chat, briefly: types to add per layer, the domain rules and where they live, contract changes (must be additive), tests to write. Ask before any breaking API / DB / file contract change.
4. **Implement inside-out** — Domain (entities, value objects, exceptions, interfaces) -> Application (service, DTOs, operators) -> Infrastructure (adapters, `Add{Feature}()`) -> Presentation (controller / endpoint). Write tests alongside each layer; for a bug fix, the failing reproduction test comes first.
5. **Verify** — build with no new warnings; all tests pass; test count = baseline + new tests.
6. **Docs** — update the docs and doc index for every unit added or changed, in the same change.
7. **Self-review** — run the Checklist; report unmet items.

## Non-negotiables (full text in rules.md)

- Business decisions live in Domain; Application loads -> calls domain behavior -> saves -> maps; controllers translate transport only.
- Orchestrators are recipes; every method has at most one indentation level; no argument mutation; no business tuples.
- Entities change only through intent-named methods; meaningful primitives are wire-compatible value objects without implicit conversions.
- Typed `DomainException`s mapped to HTTP in one place; variation by type uses `CanHandle` strategies.
- Conversion operators on DTOs; no reflection mappers; one JSON library.
- `CancellationToken cancellationToken = default` on every async method, forwarded; no blocking calls.
- Existing contracts frozen; new fields and endpoints additive. DB changes go through the project's migration process: stop and say what is needed.

## Checklist

- [ ] Followed the shape of the nearest existing feature; repo conventions respected (conflicts reported).
- [ ] Each new type in the right layer; dependency flow intact; Domain free of infra / serialization types.
- [ ] Business decisions in Domain; entities change only through intent methods; collections read-only.
- [ ] Meaningful primitives are value objects (no implicit conversion, wire-compatible).
- [ ] Orchestrators are recipes; every method <= 1 indentation level; no argument mutation; no business tuples.
- [ ] Typed domain exceptions; central HTTP mapping; no generic exceptions for business cases.
- [ ] Variation by type uses `CanHandle` strategies, not switch ladders.
- [ ] Conversion operators on DTOs; no reflection mappers.
- [ ] `CancellationToken` on every async path; no blocking calls.
- [ ] No .NET 9+ APIs; no new JSON library; no narrating or commented-out code.
- [ ] Tests for every new rule / branch / endpoint; bug fixes start with a reproducing test; build clean; all green.
- [ ] Existing contracts unchanged; new ones additive.
- [ ] Docs and doc index updated.
- [ ] Commits follow commit-hygiene (or the repository's rules).

## Final report

Discovery summary (one line each), what was added per layer, contract additions, tests before / after (counts), docs touched, unmet checklist items, defaults overridden by repository conventions.
