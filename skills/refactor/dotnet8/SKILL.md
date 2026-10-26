---
name: dotnet8
description: >
  Refactor guideline for .NET 8 (invoked as refactor:dotnet8). Behavior-preserving refactor of a C# .NET 8
  backend organized in layers (Domain, Application, Infrastructure, Presentation / DDD / onion / clean
  architecture): business rules moved into the Domain, recipe-style orchestrators with max one indentation
  level, immutability, value objects, typed domain exceptions, CanHandle strategies, conversion-operator
  mapping, and measured span-based allocation cuts. Use when asked to refactor, clean up, flatten, de-nest,
  extract value objects, move business rules into the Domain, replace type switches, remove mapper classes,
  speed up hot paths, or reduce tech debt in a .NET 8 backend. For new features or fixes use develop:dotnet8;
  for other .NET versions or non-layered code use refactor:dotnet. Not for DB migrations, frontend code, or CI work.
---

# Refactor: .NET 8

Act as a principal .NET engineer. Goal: better structure and performance with **zero observable behavior change**. Targets **.NET 8 / C# 12**; project-agnostic and self-contained.

**Read [references/rules.md](references/rules.md) before changing code.** It is the full rule set shared with `develop:dotnet8`. Recipes, loaded when the phase needs them:

- [references/clean-code.md](references/clean-code.md) — language-agnostic core: recipes, one nesting level, immutability, names, errors.
- [references/code-shape.md](references/code-shape.md) — C# recipes: orchestrators, flattening, tuples, exceptions, async.
- [references/domain-model.md](references/domain-model.md) — aggregates, entities, value objects, domain services, layout.
- [references/mapping-and-performance.md](references/mapping-and-performance.md) — conversion operators, `ReadOnlySpan` / `ReadOnlyMemory`, pooling.
- [references/layers-and-conventions.md](references/layers-and-conventions.md) — layer ownership, folders, naming, DI, controllers, logging, docs.
- [references/test-strategy.md](references/test-strategy.md) — baseline, characterization tests, Go / No-Go.
- [references/commit-hygiene.md](references/commit-hygiene.md) — branches, commit size and format, hand-off.

## Precedence

1. Explicit instructions in the task.
2. Conventions the target repository documents (`AGENTS.md`, `CLAUDE.md`, `README`, `docs/`, `.editorconfig`, `Directory.Build.props`, analyzers) or consistently follows in code.
3. The defaults in this skill.

When a default conflicts with a repository convention, follow the repository and list the conflict in the final report. Do not "fix" consistent existing patterns silently.

## Workflow

1. **Discover** — record a short Project Profile before touching code:
   - solution file (`*.sln` / `*.slnx`) and projects per layer;
   - `TargetFramework` / `global.json` / `LangVersion`. If not `net8.0`, say so before starting; never use APIs the target lacks (nor .NET 9+ APIs on .NET 8);
   - test projects, test framework, mocking library;
   - how errors become HTTP responses today, JSON library, DI registration style, logging style;
   - where docs live and how they are indexed; commit / branch conventions.
   Read the docs of every unit you will touch.
2. **Smells** — list smells in scope ranked by blast radius (Smell list). Output a short Discovery Summary, including the aggregates in scope.
3. **Baseline** — `dotnet build <solution>` and `dotnet test <solution>` green; record pass / fail / skip. Add characterization tests for every untested rule or branch you will move.
4. **Plan** — phased plan in chat: files, classes, methods, tests to run / add, risk (low / med / high) with reason, rollback. Each phase is independently shippable and one concern. Write an `.md` plan only on request.
5. **Execute** — in Phase order, one concern per commit, additive first: introduce new types, migrate call sites, delete old surface last. Prefer IDE / tool refactors (rename, extract method) over hand edits.
6. **Verify** — after every phase: build with no new warnings, tests green, count never lower than baseline. Fail = stop and fix before the next phase.
7. **Docs** — in the same change: create / update / rename / delete the docs of touched units; keep any doc index exact.
8. **Self-review** — run the Checklist; report unmet items.

### Smell list

Business `if` in Application / Presentation; methods nested > 1 level; loose `if/for/switch` in orchestrators; tuples as payloads; primitives carrying rules (status strings, ids, paths); public setters on entities; exposed mutable collections; type-discriminator ladders; generic exceptions; async without `CancellationToken`; mutated arguments; throwaway names; explanatory comments; serialization / infra types in Domain; per-pair mapper classes; reflection mappers (AutoMapper, Mapster); allocation-heavy string / byte handling on hot paths.

### Phase order (one concern per commit)

1. Characterization tests.
2. Guard clauses, flatten nesting, extract recipe sub-methods.
3. Tuples to `sealed record`; mapper classes to conversion operators on the DTO.
4. Typed domain exceptions (HTTP outcomes proven unchanged by tests).
5. Value objects over primitives (wire-compatible).
6. Business rules to Domain; private setters, intent-named methods, read-only collections.
7. `CanHandle` strategy + factory replacing type switches (only where a new case is plausible).
8. Hot-path allocations: spans / pooling, with benchmark evidence.
9. Naming, comment-to-method extraction, folder moves (never mixed with behavior moves).

## Non-negotiables (full text in rules.md)

- Business decisions live in Domain; Application loads -> calls domain behavior -> saves -> maps; controllers translate transport only.
- Orchestrators are recipes; every method has at most one indentation level; no argument mutation.
- No business tuples; no reflection mappers; typed `DomainException`s mapped to HTTP in one place.
- `CancellationToken cancellationToken = default` on every async method, forwarded.
- Frozen: API JSON, routes, DB schema / procs, stored and exported files, public package APIs, HTTP status outcomes.
- Before changing exception flow, record how the codebase maps exceptions to status codes today (a common legacy shape: `ArgumentException` -> 400, `KeyNotFoundException` -> 404, else 500) and keep those outcomes identical.
- Existing `Parse` / `FromJson` on domain types are legacy: keep them working; move behind a mapper only in a dedicated commit.

## Checklist (run before finishing)

- [ ] Project Profile recorded; repository conventions respected (conflicts reported).
- [ ] Each new type in the right layer; dependency flow intact; repositories still `internal`.
- [ ] Orchestrators read as recipes; zero loose flow blocks; every method <= 1 indentation level.
- [ ] Guard clauses at the top; no argument mutation.
- [ ] No tuples for business data; mappings via conversion operators, not mapper classes or reflection mappers.
- [ ] Business decisions in Domain; entities mutate only through intent-named methods; collections read-only.
- [ ] Meaningful primitives replaced by wire-compatible value objects (no implicit conversion).
- [ ] Type ladders replaced by `CanHandle` where a new case is plausible.
- [ ] Domain free of serialization / infra types; typed domain exceptions only.
- [ ] Every async method propagates `CancellationToken`.
- [ ] Names descriptive; no explanatory or commented-out code left.
- [ ] Spans / pooling only with evidence, behind unchanged public contracts.
- [ ] Build clean; test count >= baseline; characterization tests added.
- [ ] No API / DB / file contract change (unless requested); HTTP status outcomes unchanged.
- [ ] A single JSON library; no .NET 9+ APIs.
- [ ] Docs and doc indexes updated.
- [ ] Commits follow commit-hygiene (or the repository's rules).

## Final report

Project Profile (one line each), phases done, tests before / after (counts), unmet checklist items, repository conventions that overrode a default, docs touched, and anything deliberately left in place (e.g. a legacy parse method kept until a dedicated mapper commit).
