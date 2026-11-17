# Version Pack: .NET 11 / C# 15

Load for targets `net11.0` and above, after net8.md, net9.md and net10.md. STS, released Nov 10, 2026, supported until Nov 2028.

## Unions: closed sets of alternatives

A union holds exactly one of a fixed set of case types; the compiler checks that `switch` covers every case.

```csharp
public sealed record Product(ProductId Id, string Name);
public sealed record ProductNotFound(ProductId Id);
public sealed record ProductArchived(ProductId Id, DateTimeOffset ArchivedAt);

public union ProductLookup(Product, ProductNotFound, ProductArchived);

public static IResult ToHttpResult(ProductLookup lookup) => lookup switch
{
    Product product => Results.Ok((ProductResponse)product),
    ProductNotFound => Results.NotFound(),
    ProductArchived => Results.StatusCode(StatusCodes.Status410Gone),
};
```

Replace (old -> new), within scope and with the team's agreement on error style:

| Old idiom | On C# 15 |
| --- | --- |
| `OneOf<A, B>` or a hand-rolled `Result<T, TError>` | `union` declaring the real case types |
| `(bool Success, T? Value, Error? Error)` status tuple | `union` of the success and failure records |
| marker interface + `is` / `OfType<>` ladder over unrelated types | `union` + exhaustive `switch` |
| `abstract record` + `_ => throw new UnreachableException()` arms | `closed` hierarchy + exhaustive `switch` without discard |
| expected business outcome thrown as an exception and caught one layer up | union return value; exceptions stay for invariant violations and unexpected failures |

Rules:

- **Union vs closed hierarchy vs strategy.** Union: composes existing, unrelated types; a type may be a case of several unions. `closed` class: a hierarchy you own whose direct subtypes are fixed to one assembly. `CanHandle` strategy: the set of cases is open (plugins, other assemblies, new cases plausible). Pick by that question, not by taste.
- Case types are named, immutable `sealed record`s with domain names (`ProductNotFound`, not `Error1`). The union name says what the alternatives are about (`ProductLookup`, `PaymentOutcome`).
- Switch over every case without `_`; adding a case then produces warnings at every unhandled site, which is the point. Treat those warnings as errors in the change that adds the case.
- If any case type is nullable (`int?`), every switch needs a `null` arm. `default` of a union has a null `Value`; never expose `default(TUnion)`.
- Patterns apply to the union's `Value` (`Dog dog` matches the case); `var` and `_` apply to the whole union.
- A union is a struct storing its value as `object?`: value-type cases are boxed. On measured hot paths use record class cases, or a custom union (`[System.Runtime.CompilerServices.Union]` with `HasValue` / `TryGetValue`) that avoids boxing.
- The BCL ships the union plumbing (`UnionAttribute`, `IUnion`) but no general `Option<T>` / `Result<T, TError>`; do not add one unless the team agrees. Prefer specific unions per use case over one generic result type.
- Mapping to transport stays in one place (presentation / central mapper), exactly like exception mapping. Domain returns unions, never `IResult` or status codes.
- **Wire contracts:** System.Text.Json supports unions (`JsonUnionAttribute`, classifiers) and ASP.NET Core 11 binds them from JSON bodies (not from route, query, header or form), emitting OpenAPI `anyOf`. Changing an existing DTO to a union changes the wire format: frozen unless the task says so.
- One error style per feature: a feature either returns unions for expected outcomes or throws typed `DomainException`s for them, never both for the same outcome.

## Closed hierarchies

```csharp
public closed record class GateState;
public sealed record class GateClosed : GateState;
public sealed record class GateOpen(float Percent) : GateState;
```

- `closed` implies `abstract`; cannot combine with `sealed`, `static` or explicit `abstract`. Exhaustiveness is not transitive: mark intermediate types `closed` too.
- Good fit for entity states and value-object variants owned by one Domain assembly (`VersionStatus` as `Draft` / `Published` subtypes when behavior differs per state; keep a string-backed value object when it is only a label).
- `JsonPolymorphicAttribute(InferClosedTypePolymorphism = true)` serializes closed hierarchies without listing every `[JsonDerivedType]`; existing discriminators stay frozen.

## Other C# 15 idioms

| Old idiom | On C# 15 |
| --- | --- |
| `new List<T>(capacity) { ... }` / `new HashSet<string>(comparer) { ... }` | collection expression arguments: `[with(capacity: count), .. items]`, `[with(StringComparer.OrdinalIgnoreCase), "a", "b"]` |
| `ElementAt`-style helper methods | extension indexers: `extension(IEnumerable<int> source) { public int this[int index] => ... }` |
| `bool found` flag or `goto` to leave nested loops | labeled `break outer;` / `continue outer;` — but first try to extract the inner loop (max one indentation level); labels are a last resort |

## Libraries and frameworks: replace (old -> new)

| Old idiom | On .NET 11 |
| --- | --- |
| `Process.Start` + event wiring to capture output | `await Process.RunAndCaptureTextAsync("git", ["status", "--porcelain"], cancellationToken)` -> `ProcessTextOutput` |
| `GroupJoin` + `SelectMany` for full outer joins | `FullJoin` (EF Core 11 translates to `FULL JOIN`); tuple-returning `Join` / `LeftJoin` / `RightJoin` overloads instead of result selectors |
| copying data into `MemoryStream` to get a `Stream` | `ReadOnlyMemoryStream`, `ReadOnlySequenceStream`, `StringStream` |
| third-party Zstandard packages | `ZstandardStream` / `ZstandardEncoder` in `System.IO.Compression` |
| `(JsonTypeInfo<T>)options.GetTypeInfo(typeof(T))` | `options.GetTypeInfo<T>()` / `TryGetTypeInfo<T>()` |
| `JsonConverterFactory` only to support a generic type | open generic `[JsonConverter(typeof(OptionConverter<>))]` |
| `IStartupValidator` | `IAsyncStartupValidator` |
| `OpenTelemetry.Instrumentation.AspNetCore` for HTTP server spans | built-in attributes via `.AddSource("Microsoft.AspNetCore")`; keep the package where the repository relies on its extra options |
| sync validation that blocks on I/O (`.Result` in `IsValid`) | `AsyncValidationAttribute.IsValidAsync` / `IAsyncValidatableObject.ValidateAsync` with `AddValidation()` |
| `.ComplexProperty(e => e.Details).Property(d => d.Description)` (EF) | `.Property(e => e.Details.Description)` |

## Traps

- `decimal` and `BigInteger` conversions from `double` are now correctly rounded: `(decimal)1.23` is not `1.23m`. Use decimal literals; add tests around money conversions before retargeting.
- ZIP CRC32 is validated on read: corrupt archives now throw `InvalidDataException`.
- OpenAPI documents default to 3.2; pin `OpenApiSpecVersion.OpenApi3_1` when consumers need 3.1 (generated document is a frozen contract).
- EF Core 11 runs only on .NET 11; `UseSqlServer` defaults to compatibility level 160.
- x86/x64 baseline is now `x86-64-v2`: old CPUs fail at startup; check deployment hosts before retargeting.
- Runtime async and memory-safety rules are opt-in / preview: never enable them yourself (versions.md).
