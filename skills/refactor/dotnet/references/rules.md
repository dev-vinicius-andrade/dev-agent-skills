<!-- GENERATED from shared/dotnet/rules.md by scripts/sync-shared.mjs. Edit the source, then re-run the script. -->

# .NET Rules

The version-neutral rule set shared by `refactor:dotnet` and `develop:dotnet`. It applies the language-agnostic [clean-code.md](clean-code.md) to C#. Every rule here holds from .NET 8 / C# 12 upward; the version packs selected by [versions.md](versions.md) add or replace idioms per target framework. Placement, Model, Application and Infrastructure sections apply to layered / DDD backends; Shape, Async and Performance apply to all C# code. Recipes: [code-shape.md](code-shape.md), [domain-model.md](domain-model.md), [mapping-and-performance.md](mapping-and-performance.md), [layers-and-conventions.md](layers-and-conventions.md), [test-strategy.md](test-strategy.md).

## Placement

- A business decision (may this be published? which handler applies? is this item eligible?) lives in Domain: entity, value object, or domain service. Application services: load -> call domain behavior -> save -> map. Controllers translate transport only.
- Dependency flow `Presentation -> Application -> Domain <- Infrastructure`. No layer references a layer above it.
- Transport / infra types (`HttpContext`, `StatusCodes`, raw response writers, SQL clients, `JsonElement`) never enter Domain or Application contracts. Parsing a stored document into an aggregate is a mapper, not domain code.
- Rules spanning aggregates or needing infrastructure: domain service, interface in Domain.
- New abstractions, value objects, exceptions and helpers go in their proper layer, not next to the caller.

## Shape

- Orchestrators read like a recipe: named steps, no loose `if/else/switch/for/foreach/while`.
- Every method has at most **one** indentation level. Guard clauses and early returns at the top; extract inner loops / conditions.
- Never mutate arguments; return new instances (`record`, `with`). Return `IReadOnlyList<T>` / `IReadOnlyDictionary<TKey, TValue>`; accept abstractions (`IEnumerable<T>`, `IReadOnlyList<T>`).
- No tuples for business data: `sealed record` with derived logic on it. Only exception: short-lived `(bool Success, T? Value, Error? Error)`.
- New classes `sealed` unless inheritance is designed. Composition over inheritance; abstract bases only for `DomainException` and hierarchies the codebase already designed as polymorphic.
- Names say intent (`BuildResponseAsync`, `EnsureCanPublish`); no `a`, `x`, `temp`, `doc`, `data`, `arr`, `vars`. A comment explaining _what_ = extract a named method. XML docs on public / protected members only. No commented-out code.

## Model

- Entities: private setters, intent-named methods (`Publish()`, `Rename()`), never `SetX()`. Invariants in factory / constructor and every mutator. `Create(...)` for new, `Rehydrate(...)` for storage hydration, never public mutators from a repository. Collections exposed read-only. Aggregates reference each other by id.
- Value objects for meaningful primitives (ids, statuses, paths, money, emails): `readonly record struct` (or `record`), private constructor, validating `From` / `Create`, `Value` property, **no implicit conversion** to / from the primitive, custom `JsonConverter` so the wire format stays the primitive.
- Repositories take and return aggregates; query projections are `*Summary` / `*ReadModel`.
- Business failures: typed exceptions deriving from `DomainException` in `Domain/Exceptions/`, mapped to HTTP in one central place. Never throw `Exception` / `InvalidOperationException` for business cases; `ArgumentException` only for argument-shape guards. No hand-rolled `Result<T, TError>` type unless the team agrees; on C# 15 a union of outcomes is the sanctioned alternative where the team adopts it (net11.md). One error style per feature.
- Behavior that varies by type / format: `CanHandle` strategy (below) when the set of cases is open (new cases plausible, cases registered by other assemblies). No `switch` / `OfType<>` ladders. When the set is closed and known at compile time, C# 15 unions or `closed` hierarchies with exhaustive `switch` are the better tool (net11.md).

## Strategy pattern (CanHandle)

```csharp
public interface IHandler<TContext, TResult>
{
    bool CanHandle(TContext context);
    Task<TResult> HandleAsync(TContext context, CancellationToken cancellationToken = default);
}

public sealed class HandlerFactory<TContext, TResult>(IEnumerable<IHandler<TContext, TResult>> handlers)
{
    public IHandler<TContext, TResult> Resolve(TContext context) =>
        handlers.FirstOrDefault(handler => handler.CanHandle(context))
            ?? throw new HandlerNotSupportedException(typeof(TContext).Name);
}
```

Contract in Domain, one small `internal sealed` class per case, DI collects `IEnumerable<IHandler>` via the layer's `Add{Feature}()` extension, factory fails with a typed exception when nothing matches. Adding a case = one class + one registration. If the codebase already has such a family, follow its shape and names.

## Application and mapping

- `{Feature}ApplicationService` + `I{Feature}ApplicationService` (or the repository's handler / MediatR style). Constructor null guards; `ILogger<T>` with structured templates (`"Creating order {OrderNumber}"`), never interpolation.
- DTOs: classes with `{ get; set; }` named `Create{X}Request`, `{X}Response` (keep records if the project already uses them).
- Map with conversion operators on the DTO: implicit when total and cannot throw, explicit when it validates or drops data. `Dto -> Aggregate` is never implicit. No AutoMapper / Mapster / reflection mappers. Complex or lossy mapping: static pure mapper under `Application/Mappers/`.
- Options: `{Feature}Options` with `const string SectionName`, validated at startup.

## Infrastructure and presentation

- Repositories `internal sealed`, implement a Domain interface, registered by a public `Add{Feature}()` extension; named `{Provider}{Entity}Repository`.
- Controllers: `[ApiController]`, `[Route]`, `[Produces("application/json")]`, `[ProducesResponseType]` per outcome, `CancellationToken` last. 201 / 200 / 204 on success, 400 / 404 via central exception mapping. Kebab-case routes.
- DI Scoped by default; Singleton only for stateless, thread-safe services.

## Async and language

- Every async method takes `CancellationToken cancellationToken = default` and forwards it down the chain; `ThrowIfCancellationRequested()` in long loops and streams. No `.Result`, `.Wait()`, `async void`.
- `ConfigureAwait`: follow the project's policy. ASP.NET Core apps and workers have no sync context; libraries consumed by UI / legacy hosts use `ConfigureAwait(false)` consistently.
- Nullable enabled and respected; switch expressions and patterns to flatten; `ArgumentNullException.ThrowIfNull`; primary constructors for DI.
- Never use an API or language feature the target framework / effective `LangVersion` lacks (versions.md). One JSON library (keep the project's; `System.Text.Json` by default).

## Performance

- Clear code first. `ReadOnlySpan<T>` / `ReadOnlyMemory<T>`, `stackalloc`, `ArrayPool` only on measured hot paths, inside private / internal helpers; public contracts stay plain.
- `FrozenDictionary` for read-mostly lookups. No multiple enumeration; no `ToList()` just to iterate.

## Frozen contracts

Unless the task says otherwise these never change: API request / response JSON, public routes, DB schema and stored procedures, stored and exported files, public package APIs, HTTP status outcomes. New fields and endpoints are additive and backward compatible. Domain adapts to storage through mappers / repositories, not the reverse. DB changes go through the project's migration process; stop and say what is needed.
