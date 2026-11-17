# Version Selection (.NET / C#)

The rules in [rules.md](rules.md) hold from .NET 8 / C# 12 upward. Version packs add what each release changes: new idioms to prefer, older idioms they replace, and traps. Pick packs from the target, never from the newest SDK installed.

## Detect the target

1. `TargetFramework` / `TargetFrameworks` in each touched `*.csproj`, or inherited from `Directory.Build.props`.
2. Effective C# version: explicit `LangVersion` if set, else the framework default (net8.0 = C# 12, net9.0 = C# 13, net10.0 = C# 14, net11.0 = C# 15).
3. `global.json` SDK pin (decides which compiler and analyzers run).
4. Record all three in the Project Profile.

## Load packs

- Load every pack from [net8.md](net8.md) up to the target framework: a `net10.0` project reads net8, net9, net10. Each pack lists only what that release added or changed.
- **Migrating** (`migrate:dotnet`): load every pack up to the **new** target; the packs above the current target are the crossed versions whose Traps and Replace tables drive the upgrade.
- **Multi-targeting** (`net8.0;net10.0`): code shared across targets follows the **lowest** target. Newer idioms only inside `#if NET10_0_OR_GREATER` blocks, and only when the gain is real; prefer one code path.
- **Libraries vs language:** library APIs are gated by the target framework. Language features are gated by the effective `LangVersion`; a syntax-only feature from a newer C# may compile on an older framework, but use it only if the repository already raised `LangVersion` on purpose. Never raise `LangVersion` or the target framework yourself.
- **Preview:** never enable `<LangVersion>preview</LangVersion>`, `EnablePreviewFeatures` or preview runtime features (e.g. runtime async) unless the repository already does.
- **Newer than this skill:** if the target is above the newest pack, apply the newest pack and say so in the report; do not guess at newer features.

## Support status (as of November 2026)

| Target | C# default | Track | End of support |
| --- | --- | --- | --- |
| net8.0 | 12 | LTS | Nov 10, 2026 (ended) |
| net9.0 | 13 | STS | Nov 10, 2026 (ended) |
| net10.0 | 14 | LTS | Nov 2028 |
| net11.0 | 15 | STS | Nov 2028 |

A target past end of support gets no security patches. Mention it once in the report; retargeting is a separate, explicitly requested task (`migrate:dotnet`), never part of a refactor or a feature.

## Modernizing inside a refactor

- Replacing an older idiom with a pack's newer one is a behavior-preserving refactor only when the pack says the swap is equivalent. Otherwise prove equivalence with tests first.
- One idiom per commit (e.g. "object locks to `Lock`"), never mixed with structural moves.
- Do not modernize code outside the task's scope just because a pack allows it; list it as a follow-up.
