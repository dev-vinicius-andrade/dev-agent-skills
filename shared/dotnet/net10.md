# Version Pack: .NET 10 / C# 14 (LTS)

Load for targets `net10.0` and above, after net8.md and net9.md. LTS, supported until Nov 2028.

## C# 14: replace (old -> new)

| Old idiom | On C# 14 |
| --- | --- |
| Explicit backing field only to validate or normalize in a setter | `field` keyword: `public string Name { get; set => field = value?.Trim() ?? throw new ArgumentNullException(nameof(value)); }` |
| `GetX(this T value)` extension methods that are really properties | extension members: `extension(Order order) { public bool IsEmpty => order.Lines.Count == 0; }` |
| static helper classes for type-level helpers (`OrderFactory.Empty()`) | static extension members: `extension(Order) { public static Order Empty => ...; }` |
| `if (customer is not null) customer.Order = order;` | null-conditional assignment: `customer?.Order = order;` (right side evaluated only when the receiver is not null; no `++` / `--`) |
| `"List"` string literal or `nameof(List<int>)` | `nameof(List<>)` |
| `(string text, out int result) => int.TryParse(text, out result)` | `(text, out result) => int.TryParse(text, out result)` (modifiers without types) |
| `.AsSpan()` calls only to satisfy span parameters | implicit `T[]` -> `Span<T>` / `ReadOnlySpan<T>` conversions; spans as extension receivers |

Rules for C# 14 idioms:

- Group extension members for one receiver in one `extension` block inside a `{Receiver}Extensions` static class; existing `this` extension methods stay valid, migrate them only within scope.
- `field` keeps invariants next to the property; complex rules still belong in intent-named methods on the entity.
- A type with a member named `field` must use `@field` / `this.field` when adopting the keyword; check before introducing it.
- Implicit span conversions can change overload resolution for existing calls: rebuild and run tests after retargeting, before any other change.

## Libraries and frameworks: prefer

- `JsonSerializerOptions.Strict` for new inbound contracts that must reject unknown or duplicate members; existing contracts keep their options (frozen behavior).
- `ZipFile.OpenAsync`, `ZipFile.ExtractToDirectoryAsync`, `ZipArchive.CreateAsync` instead of sync ZIP calls on request paths.
- `CompareOptions.NumericOrdering` instead of hand-written natural-sort comparers.
- `OrderedDictionary<TKey, TValue>.TryAdd(key, value, out index)` / `TryGetValue(key, out value, out index)`.
- ASP.NET Core 10 minimal APIs: built-in validation via `builder.Services.AddValidation()` instead of hand-rolled endpoint filters, when the project has no validation library already.
- Server-sent events: `TypedResults.ServerSentEvents(...)` instead of manual `text/event-stream` writing.
- LINQ `LeftJoin` / `RightJoin` instead of `GroupJoin` + `SelectMany` + `DefaultIfEmpty` (EF Core 10 translates them).
- EF Core 10: named query filters (several filters per entity, disable selectively) instead of one combined filter; `ExecuteUpdateAsync` with a regular lambda for conditional setters instead of expression-tree building.
- Post-quantum crypto (`MLKem`, `MLDsa`) only where a requirement asks for it; `MLDsa` / `SlhDsa` are `[Experimental]` (SYSLIB5006).

## Traps

- `TimeSpan.FromMilliseconds(long, long)` now requires its second argument; single-argument calls bind to the new `FromMilliseconds(long)` overload.
- `dotnet test` on Microsoft.Testing.Platform changes CLI arguments; follow the repository's test command.
