---
name: dotnet
description: >
  Refactor guideline for .NET (invoked as refactor:dotnet). Behavior-preserving refactoring of C#/.NET code on
  any supported target (.NET 8, 9, 10, 11 / C# 12-15): detects the target framework and LangVersion and loads
  the matching version packs (Lock, params spans, extension members, field keyword, unions, closed
  hierarchies, ...). Covers decoupling, DI, structured logging, recipe-style orchestrators with max one
  indentation level, immutability, typed errors, and for layered / DDD backends business rules in the Domain,
  value objects, CanHandle strategies, conversion-operator mapping and measured span-based allocation cuts. Use
  when asked to refactor, clean up, flatten, decouple, modernize idioms, or reduce tech debt in C#/.NET code, or
  to produce a refactoring plan. For new features or bug fixes use develop:dotnet. Not for framework
  retargeting, DB migrations, frontend code, or CI work.
---

# Refactor: .NET

Act as a principal .NET engineer. Goal: better structure and performance with **zero observable behavior change**, using only what the project's target framework and C# version provide.

**Before changing code read [references/versions.md](references/versions.md) and [references/rules.md](references/rules.md)**, then load the version packs `versions.md` selects. References:

- [references/versions.md](references/versions.md) — detect target / LangVersion, which packs to load, multi-targeting, support status.
- [references/net8.md](references/net8.md), [references/net9.md](references/net9.md), [references/net10.md](references/net10.md), [references/net11.md](references/net11.md) — per-version idioms: prefer, replace (old -> new), traps.
- [references/rules.md](references/rules.md) — version-neutral rule set (shared with `develop:dotnet`).
- [references/clean-code.md](references/clean-code.md) — language-agnostic core rules.
- [references/code-shape.md](references/code-shape.md) — C# recipes: orchestrators, flattening, tuples, exceptions, async.
- [references/domain-model.md](references/domain-model.md) — aggregates, entities, value objects, domain services.
- [references/mapping-and-performance.md](references/mapping-and-performance.md) — conversion operators, spans, pooling.
- [references/layers-and-conventions.md](references/layers-and-conventions.md) — layer ownership, folders, naming, DI, controllers, logging, docs.
- [references/test-strategy.md](references/test-strategy.md) — baseline, characterization tests, Go / No-Go.
- [references/commit-hygiene.md](references/commit-hygiene.md) — branches, commit size and format, hand-off.

## Precedence

1. Explicit instructions in the task.
2. Conventions the target repository documents (`AGENTS.md`, `CLAUDE.md`, `README`, `docs/`, `.editorconfig`, `Directory.Build.props`, analyzers) or consistently follows in code.
3. The version packs for the target (they never override 1 or 2).
4. The other defaults in this skill.

When a default conflicts with a repository convention, follow the repository and list the conflict in the final report. Do not "fix" consistent existing patterns silently.

## Workflow

1. **Discover** — record a short Project Profile before touching code:
   - solution file (`*.sln` / `*.slnx`), projects, and whether they form layers (Domain / Application / Infrastructure / Presentation or equivalent);
   - per touched project: `TargetFramework(s)`, effective `LangVersion`, `global.json` SDK; the packs this selects (versions.md);
   - test projects, test framework, mocking library;
   - how errors become HTTP responses today, error style (exceptions, unions, result types), JSON library, DI and logging style;
   - where docs live and how they are indexed; commit / branch conventions.
   Read the docs of every unit you will touch.
2. **Smells** — list smells in scope ranked by blast radius (Smell list), plus outdated idioms the loaded packs replace. Output a short Discovery Summary.
3. **Baseline** — `dotnet build <solution>` and `dotnet test <solution>` green; record pass / fail / skip. Add characterization tests for every untested rule or branch you will move.
4. **Plan** — phased plan in chat: files, classes, methods, tests to run / add, risk (low / med / high) with reason, rollback. Each phase independently shippable and one concern. Markdown file only on request.
5. **Execute** — in Phase order, one concern per commit, additive first: introduce new types, migrate call sites, delete old surface last. Prefer IDE / tool refactors.
6. **Verify** — after every phase: build with no new warnings, tests green, count never below baseline. Fail = stop and fix.
7. **Docs** — in the same change: update the docs of touched units and keep any doc index exact.
8. **Self-review** — run the Checklist; report unmet items.

### Smell list

Business `if` in Application / Presentation; methods nested > 1 level; loose `if/for/switch` in orchestrators; tuples as payloads; primitives carrying rules; public setters on entities; exposed mutable collections; type-discriminator ladders; generic exceptions; swallowed exceptions; async without `CancellationToken`; mutated arguments; throwaway names; explanatory comments; serialization / infra types in Domain; per-pair mapper classes; reflection mappers; `new` of services and service locators; `Console.WriteLine` / interpolated log templates; allocation-heavy string / byte handling on hot paths; idioms the loaded version packs replace.

### Phase order (one concern per commit)

1. Characterization tests.
2. Logging and cross-cutting concerns (observability for every later phase), when they are missing.
3. Decoupling: interfaces at seams, constructor injection, remove service locators and `new` of services.
4. Guard clauses, flatten nesting, extract recipe sub-methods.
5. Tuples to `sealed record` (or a union on C# 15); mapper classes to conversion operators.
6. Typed errors (HTTP outcomes proven unchanged by tests).
7. Layered / DDD only: value objects over primitives (wire-compatible); business rules to Domain; private setters, intent-named methods, read-only collections.
8. Type switches: `CanHandle` strategies for open sets; unions / `closed` hierarchies for closed sets on C# 15.
9. Version idioms from the loaded packs, one idiom per commit, only swaps the pack marks equivalent.
10. Hot-path allocations: spans / pooling, with benchmark evidence.
11. Naming, comment-to-method extraction, folder moves (never mixed with behavior moves).

## Non-negotiables (full text in rules.md and the packs)

- Never use an API or language feature the target framework / effective `LangVersion` lacks; never raise either, never enable preview features.
- Orchestrators are recipes; every method has at most one indentation level; no argument mutation; no business tuples.
- Layered code: business decisions live in Domain; Application loads -> calls domain behavior -> saves -> maps; controllers translate transport only.
- Typed errors mapped to transport in one place; one error style per feature; no reflection mappers.
- `CancellationToken cancellationToken = default` on every async method, forwarded.
- Frozen: API JSON, routes, DB schema / procs, stored and exported files, public package APIs, HTTP status outcomes. Before changing error flow, record today's exception-to-status mapping and keep it identical.
- Patterns need a concrete problem; every new abstraction has one purpose.

## Checklist (run before finishing)

- [ ] Project Profile recorded, including target(s), LangVersion and loaded packs; repo conventions respected.
- [ ] No API or syntax above the target / LangVersion; multi-target code follows the lowest target.
- [ ] Each new type in the right layer; dependency flow intact; repositories still `internal`.
- [ ] Orchestrators are recipes; zero loose flow blocks; every method <= 1 indentation level; no argument mutation.
- [ ] No business tuples; mappings via conversion operators, not mapper classes or reflection mappers.
- [ ] Layered code: decisions in Domain, intent-named mutators, read-only collections, wire-compatible value objects.
- [ ] Open sets use `CanHandle`; closed sets use unions / `closed` hierarchies where C# 15 is available; switches exhaustive without `_`.
- [ ] Typed errors; one error style per feature; Domain free of serialization / infra / transport types.
- [ ] Every async method propagates `CancellationToken`; logging structured.
- [ ] Version-idiom swaps one per commit and covered by tests; out-of-scope modernizations listed, not done.
- [ ] Spans / pooling only with evidence, behind unchanged public contracts.
- [ ] Build clean; test count >= baseline; characterization tests added.
- [ ] No contract change (unless requested); HTTP outcomes unchanged; single JSON library.
- [ ] Docs and doc indexes updated; commits follow commit-hygiene (or the repository's rules).

## Final report

Project Profile (one line each, with target / LangVersion / packs), phases done, tests before / after (counts), unmet checklist items, conventions that overrode a default, docs touched, follow-ups (out-of-scope modernizations, end-of-support target), and anything deliberately left in place.
