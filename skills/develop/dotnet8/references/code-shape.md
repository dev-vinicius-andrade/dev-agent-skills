<!-- GENERATED from shared/dotnet8/code-shape.md by scripts/sync-shared.mjs. Edit the source, then re-run the script. -->

# Code Shape Recipes (C#)

C# forms of the rules in [clean-code.md](clean-code.md). Illustrative examples (names are made up). Apply the pattern, not the names.

## Recipe orchestrator

Top-level method = table of contents. Details hidden in focused private methods.

```csharp
public async Task<QueuedResponse> HandleAsync(
    string orderId,
    SubmitRequest request,
    CancellationToken cancellationToken = default)
{
    ValidateRequest(request);

    var customer = await ResolveCustomerAsync(request.CustomerId, cancellationToken);
    var job = CreateJob(orderId, request, customer);

    await DispatchAsync(job, cancellationToken);

    return BuildQueuedResponse(job);
}
```

Guards, iterations, fallbacks, and serialization pipelines each get their own method. If an orchestrator contains `if`, `for`, `switch`, or `while`, extract it.

## Flattening nested logic (max 1 indentation level)

Before: loop -> if -> loop -> if. After: pipeline of one-level functions plus small boolean queries.

```csharp
public sealed record ImportStats(int Total, int Matched)
{
    public int Unmatched => Total - Matched;
    public static ImportStats Empty => new(0, 0);
    public ImportStats Add(ImportStats other) => new(Total + other.Total, Matched + other.Matched);
}

public static ImportStats CountImportStats(
    IReadOnlyList<JsonElement> batches,
    IReadOnlyList<IReadOnlyDictionary<string, string>> catalogs) =>
    batches
        .Select((batch, batchIndex) => ProcessBatch(batch, catalogs.ElementAtOrDefault(batchIndex)))
        .Aggregate(ImportStats.Empty, (total, batch) => total.Add(batch));

private static ImportStats ProcessBatch(JsonElement batch, IReadOnlyDictionary<string, string>? catalog)
{
    if (batch.ValueKind != JsonValueKind.Array)
        return ImportStats.Empty;

    return batch.EnumerateArray()
        .Where(item => item.ValueKind == JsonValueKind.Object)
        .Where(HasIdentity)
        .Aggregate(ImportStats.Empty, (stats, item) => EvaluateItem(item, catalog, stats));
}

private static bool HasIdentity(JsonElement item) =>
    HasPopulatedString(item, "sku") || HasPopulatedArray(item, "aliases");

private static bool HasPopulatedString(JsonElement item, string propertyName) =>
    item.TryGetProperty(propertyName, out var property)
    && property.ValueKind == JsonValueKind.String
    && !string.IsNullOrWhiteSpace(property.GetString());

private static bool HasPopulatedArray(JsonElement item, string propertyName) =>
    item.TryGetProperty(propertyName, out var property)
    && property.ValueKind == JsonValueKind.Array
    && property.GetArrayLength() > 0;
```

Tools: guard clause + early return, `Where/Select/Aggregate`, extracted boolean queries, switch expressions, property patterns.

## Replace tuples

```csharp
// before: (string HeaderJson, List<Attachment> Attachments) Parse(...)
public sealed record ParsedMessage(string HeaderJson, IReadOnlyList<Attachment> Attachments);
```

Put derived logic on the record (see `ImportStats`). Only allowed tuple: short-lived `(bool Success, T? Value, Error? Error)`.

## Never mutate arguments

```csharp
// before: void Apply(Invoice invoice) { invoice.Reference = reference; }
public static Invoice WithReference(Invoice invoice, string reference) => invoice with { Reference = reference };
```

For entities, mutation is allowed only inside the entity through intent-named methods; callers never poke fields of arguments they were handed.

## Comments become methods

```csharp
// before:  // Send the header first so the client can render progressively
//          await channel.WriteAsync(header, ct);
await SendHeaderFirstAsync(channel, header, cancellationToken);
```

## Typed domain exceptions

```csharp
public abstract class DomainException(string message) : Exception(message);
public sealed class EntityNotFoundException(string entity, string id)
    : DomainException($"{entity} '{id}' was not found.");
```

Domain throws these; global middleware/filters map to HTTP. Business code never throws `Exception` / `InvalidOperationException`, never returns ad-hoc error payloads, never references status codes.

## Async hygiene

- `CancellationToken cancellationToken = default` on every async method, forwarded through the whole chain.
- `cancellationToken.ThrowIfCancellationRequested()` inside long loops / streaming.
- `IAsyncEnumerable<T>` with `[EnumeratorCancellation]` for streaming.
- `ValueTask` only for frequently synchronous hot paths.
- No `.Result`, `.Wait()`, `async void`.

## Language tools to flatten and clarify

```csharp
public decimal Discount(Order order) => order switch
{
    { Total: > 1000m } => 0.15m,
    { Total: > 500m } => 0.10m,
    _ => 0m,
};
```

`ArgumentNullException.ThrowIfNull`, list/property/relational patterns, `required` + `init` for internal models, primary constructors for DI.

## Anti-patterns to remove

- Reflection mappers (AutoMapper, Mapster, ExpressMapper). Use conversion operators or explicit code. `UnsafeAccessor` when private access is genuinely needed.
- Deep inheritance / abstract bases (except `DomainException`).
- Service locator, `new` of services inside methods.
- Catch-all swallowed exceptions.
