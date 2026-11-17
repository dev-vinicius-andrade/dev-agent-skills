<!-- GENERATED from shared/dotnet/net8.md by scripts/sync-shared.mjs. Edit the source, then re-run the script. -->

# Version Pack: .NET 8 / C# 12 (baseline)

Load for every target `net8.0` and above. Ended support on Nov 10, 2026 (see versions.md).

## Prefer

- Primary constructors for DI-only classes; keep explicit fields when the parameter needs validation or is reassigned.
- Collection expressions (`[]`, `[.. items]`) for arrays, lists, spans.
- `required` + `init` for internal models; `sealed record` for results.
- `TimeProvider` (injected) instead of `DateTime.UtcNow` / `DateTimeOffset.UtcNow` in code under test.
- `FrozenDictionary` / `FrozenSet` for read-mostly lookup tables built once.
- `IExceptionHandler` (ASP.NET Core) for central exception-to-ProblemDetails mapping, when the project has no mapping yet.
- Keyed services (`AddKeyedScoped`, `[FromKeyedServices]`) only for a small, fixed set of named implementations; a `CanHandle` factory otherwise.
- `ArgumentNullException.ThrowIfNull`, `ArgumentException.ThrowIfNullOrWhiteSpace`, `ArgumentOutOfRangeException.ThrowIfNegative` and siblings for guards.

## Not available on net8.0 (do not write)

- `System.Threading.Lock`, `params ReadOnlySpan<T>`, `Dictionary.GetAlternateLookup`, `OrderedDictionary<TKey, TValue>`, LINQ `CountBy` / `AggregateBy` / `Index`, `Task.WhenEach`, `Guid.CreateVersion7`, `Base64Url`, `JsonSerializerOptions.Web`, span `Split` enumerators (net9.md).
- `field` keyword, extension blocks, null-conditional assignment (C# 14), unions and `closed` (C# 15), unless `LangVersion` was raised on purpose (versions.md).

## Traps

- Span-keyed dictionary lookups are impossible: convert at the boundary or switch on the span for small fixed sets.
- Split a `ReadOnlySpan<char>` with an `IndexOf` loop in a small private helper.
