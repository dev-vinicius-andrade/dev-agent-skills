# Version Pack: .NET 9 / C# 13

Load for targets `net9.0` and above, after net8.md. Ended support on Nov 10, 2026 (see versions.md).

## Replace (old -> new)

| Old idiom | On .NET 9+ |
| --- | --- |
| `private readonly object _gate = new();` + `lock (_gate)` | `private readonly Lock _gate = new();` + `lock (_gate)` (compiler uses `Lock.EnterScope()`; never cast a `Lock` to `object`, that falls back to `Monitor`) |
| `params T[]` on hot APIs | `params ReadOnlySpan<T>` (no array allocation) |
| `GroupBy(...).Select(g => (g.Key, g.Count()))` | `CountBy(keySelector)` |
| `GroupBy` only to fold values per key | `AggregateBy(keySelector, seed, func)` |
| `Select((item, i) => ...)` only to get the index | `Index()` -> `(int Index, T Item)` |
| `Dictionary<string, T>` lookup with `span.ToString()` | `dictionary.GetAlternateLookup<ReadOnlySpan<char>>()` (also on `HashSet<string>`) |
| non-generic `OrderedDictionary` | `OrderedDictionary<TKey, TValue>` |
| `Task.WhenAny` loop to process tasks as they finish | `await foreach (var task in Task.WhenEach(tasks))` |
| `Guid.NewGuid()` for ids that should sort by creation time | `Guid.CreateVersion7()` |
| `Convert.ToBase64String` + manual `+/=` replacement | `Base64Url.EncodeToString` / `DecodeFromChars` |
| `new JsonSerializerOptions(JsonSerializerDefaults.Web)` | `JsonSerializerOptions.Web` (read-only singleton) |
| `TimeSpan.FromSeconds(101.832)` | `TimeSpan.FromSeconds(seconds: 101, milliseconds: 832)` (no double rounding) |
| `Regex.Split` on hot paths | `Regex.EnumerateSplits(span, ...)` |
| `IndexOf` loop to split a `ReadOnlySpan<char>` | `span.Split(',')` range enumerator |
| Swashbuckle in new APIs | built-in `AddOpenApi()` / `MapOpenApi()` (`Microsoft.AspNetCore.OpenApi`); keep Swashbuckle where the repository already uses it |

Each swap above is behavior-preserving except `CreateVersion7` (different id shape: only for new ids, never for existing stored ids) and the JSON options (verify serialized output with a test).

## Prefer

- C# 13 partial properties for source generators (`[GeneratedRegex]` on a partial property).
- `JsonSerializerOptions.RespectNullableAnnotations = true` for new contracts (opt-in; changes deserialization of nulls).
- `SearchValues.Create([...], StringComparison.OrdinalIgnoreCase)` for repeated multi-string searches on hot paths.
- `ReadOnlySet<T>` to expose a set without copying.

## Traps

- `BinaryFormatter` is removed (APIs always throw): replace with an explicit serializer before upgrading.
- `HttpClientFactory` no longer logs header values by default; do not re-enable for secrets.
- `field` keyword was preview in C# 13; do not use it on net9.0 unless the repository enables preview.
