<!-- GENERATED from shared/core/clean-code.md by scripts/sync-shared.mjs. Edit the source, then re-run the script. -->

# Clean Code Core (all stacks)

Language-agnostic rules every skill in this marketplace applies. Stack skills show the idiomatic form (C# records, React hooks, ...). Repository conventions still win over these defaults.

## Recipe orchestrators

- A top-level method (controller action, handler, use case, event handler, component body) reads like a recipe: a short list of named steps that delegate to focused helpers.
- No loose `if` / `else` / `switch` / `for` / `foreach` / `while` inside an orchestrator. Guards, validations, iterations, fallbacks and serialization pipelines each get their own named function.
- Low-level detail (parsing, formatting, I/O plumbing) never appears at orchestrator level.

## One level of control-flow nesting

- No function exceeds **one** level of control-flow indentation. Loop containing a condition, or condition containing a loop: extract the inner part.
- Split compound conditions into named boolean queries (`hasDataBinding(field)`, `isEligible(order)`).
- Guard clauses and early returns first; fail fast instead of building `if` staircases.
- Markup nesting (JSX, templates) is not control flow; the rule applies to logic.

## Immutability

- Never mutate arguments, collections or objects a function was handed. Return a new value or a copy with changes.
- Expose read-only views of collections; keep mutable state private to its owner.
- An entity / store may change its own state, only through intent-named operations.

## Names and comments

- Names carry intent and domain meaning (`declaredVariables`, `buildQueuedResponse`). No throwaway names: `a`, `x`, `tmp`, `temp`, `data`, `doc`, `arr`, `vars`, `var1`.
- A comment that explains _what_ a block does means: extract a function named after that intent and delete the comment.
- Comments stay only for non-obvious business edge cases, external protocol or SDK quirks, deliberate deviations, and legal text. No commented-out code.

## Types over ad-hoc shapes

- No positional tuples / anonymous bags for business data. Give the payload a named, immutable type and put derived logic on it.
- Sole exception: short-lived internal status results such as `(success, value, error)`.
- Model meaningful primitives (ids, statuses, money, paths) as their own types when the stack supports it.

## Errors

- Business failures use explicit, typed errors with a domain name (`EntityNotFound`, `InvalidPayload`); never a bare generic error.
- Translate errors to transport (HTTP status, UI message) in one central place, not deep in business code.
- Never swallow errors; log with context, then rethrow or surface.

## Extensibility

- Behavior that varies by type, format or kind: one small handler per case that says whether it can handle the input, plus a resolver that picks the first match and fails with a typed error when none does. No growing `switch` / `if` ladders.
- Add a case = add one handler + one registration. Apply only where a new case is plausible.

## Size and duplication

- One responsibility per function, class, component, hook.
- Copying more than two lines means extract.
- Size is a signal, not a target; stop when each unit has one clear responsibility.
