---
name: dotnet
description: >
  Refactor guideline for .NET (invoked as refactor:dotnet). Version- and architecture-agnostic refactoring of
  C#/.NET code (any target framework, any project shape): decoupling, dependency injection, structured logging,
  error handling, design patterns, clean code, with a test safety net and a phased plan. Use when asked to
  refactor, restructure, clean up, decouple, or reduce technical debt in a C#/.NET codebase, or to produce a
  refactoring plan. For a layered / DDD backend on .NET 8 use refactor:dotnet8, which carries the stricter rule
  set. Not for greenfield scaffolding, database migrations, or unrelated CI/CD work.
---

# Refactor: .NET

Act as a principal .NET engineer. Goal: more maintainable, testable code with **no observable behavior change**, on whatever framework version and architecture the repository uses.

References, loaded when needed:

- [references/clean-code.md](references/clean-code.md) — language-agnostic core rules every change follows.
- [references/test-strategy.md](references/test-strategy.md) — baseline, characterization tests, Go / No-Go.
- [references/commit-hygiene.md](references/commit-hygiene.md) — branches, commit size and format, hand-off.

If the target is a layered / DDD backend on `net8.0`, switch to `refactor:dotnet8`.

## Precedence

1. Explicit instructions in the task.
2. Conventions the target repository documents (`AGENTS.md`, `CLAUDE.md`, `README`, `docs/`, `.editorconfig`, `Directory.Build.props`, analyzers) or consistently follows in code.
3. The defaults in this skill.

Report any default you did not apply because the repository says otherwise. Never use APIs the target framework lacks.

## Workflow

1. **Discover** — build a model of the codebase and output a Discovery Summary ranked by severity and blast radius:
   - solution structure: projects, layers, assembly dependency graph, target framework(s);
   - coupling hotspots: many concrete dependencies, God classes, circular references, `new` of services, service locators;
   - smells: long methods (> ~30 lines), large classes (> ~300 lines), deep nesting, primitive obsession, feature envy, shotgun surgery, duplication;
   - logging: framework in use (`Microsoft.Extensions.Logging`, Serilog, NLog) vs `Console.WriteLine` / `Debug.WriteLine`; structured or interpolated;
   - error handling: catch-all, swallowed exceptions, missing context, generic exception types;
   - naming and organization: namespaces vs folders, conventions.
2. **Baseline** — run the build and `dotnet test`; record counts; add characterization tests for untested code you will change (see test-strategy). All green before the first refactor commit.
3. **Plan** — phased plan in chat (Markdown file only when asked or the repository workflow requires it). Each phase independently shippable, listing: changes, specific files / classes / methods, before / after sketches for non-trivial moves, tests to run / add, rollback, risk (low / med / high) with reason.
4. **Execute** — in Phase order, one concern per commit. Refactor internals first; change public signatures only when the plan says so. Prefer IDE refactors (rename, extract method / interface). Constructor injection over property / method injection.
5. **Verify** — after every phase: build with no new warnings (warnings-as-errors only if the repository configures it), all tests pass, count not lower than baseline, coverage not lower. Fail = stop and fix.
6. **Self-review** — run the Checklist, fix issues, then deliver.

### Phase order

1. **Foundation** — logging and cross-cutting concerns first, for observability of every later change.
2. **Decoupling** — interfaces at seams, DI registration, remove service locators and `new` of services; makes code testable.
3. **Structure** — guard clauses, flatten nesting, recipe orchestrators, typed results instead of tuples, typed exceptions, strategies instead of type switches (clean-code.md).
4. **Clean code** — naming, comment-to-method extraction, dead code removal, folder / namespace alignment.
5. **Cleanup** — final test run, removed dead code listed, docs updated.

## Core rules

- Apply [clean-code.md](references/clean-code.md): recipe orchestrators, one nesting level, no argument mutation, intent names, no narrating comments, named types over tuples, typed errors, `CanHandle`-style handlers over ladders.
- Logging: inject `ILogger<T>` (or the project's logger); structured templates with named placeholders, never interpolation; right levels; never log and swallow.
- Async: `CancellationToken` on async methods, forwarded; no `.Result`, `.Wait()`, `async void`.
- Patterns are justified by a concrete problem, never applied for their own sake. Every new abstraction has one clear purpose.
- Public API, wire formats, DB schema and stored files are frozen unless the task says otherwise.

## Checklist

- [ ] Discovery Summary ranked; repository conventions respected (conflicts reported).
- [ ] Every phase names specific files, classes and methods — no vague "refactor the service layer".
- [ ] No phase depends on a later one; no phase removes something a later phase uses.
- [ ] Test strategy explicit per phase; characterization tests added; counts >= baseline.
- [ ] Before / after sketches are valid C# for the target framework.
- [ ] Rollback strategy is realistic (not just "revert the commit").
- [ ] Logging is structured with proper levels.
- [ ] clean-code.md rules hold for every touched method.
- [ ] No unnecessary complexity introduced; each pattern has a stated reason.
- [ ] Commits follow commit-hygiene (or the repository's rules).

## Final report

Summarize what changed per phase, tests before / after (counts), unmet checklist items, repository conventions that overrode a default, and what was deliberately left for later.
