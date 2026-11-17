# Upgrade Steps (.NET retargeting)

Recipes for each phase of `migrate:dotnet`. Illustrative names and versions only; discover the real ones.

## Inventory (Migration Profile)

Record before any change:

| Item | Where to look |
| --- | --- |
| Target frameworks per project | `*.csproj` `TargetFramework(s)`, `Directory.Build.props`, `Directory.Build.targets` |
| `LangVersion`, `Nullable`, `TreatWarningsAsErrors`, `AnalysisLevel` | same files |
| SDK pin and roll-forward | `global.json` (`sdk.version`, `rollForward`) |
| Central package versions | `Directory.Packages.props` (`ManagePackageVersionsCentrally`) |
| Framework-coupled packages | `Microsoft.AspNetCore.*`, `Microsoft.EntityFrameworkCore.*`, `Microsoft.Extensions.*`, `System.*`, `Npgsql.EntityFrameworkCore.*`, `Pomelo.*`, test SDKs |
| Container images | `Dockerfile` `FROM mcr.microsoft.com/dotnet/...:<tag>`, compose files, `ContainerBaseImage` |
| CI / build agents | pipeline files (`actions/setup-dotnet`, `UseDotNet@2`, SDK images) |
| Hosting | App Service / Functions runtime settings, Kubernetes base images, IIS hosting bundle, self-contained RIDs |
| Consumers | is any project a published package? which frameworks do its consumers run? |
| Tools | `.config/dotnet-tools.json` (e.g. `dotnet-ef`) |

Commands (use whichever the SDK supports):

```bash
dotnet --list-sdks
dotnet list package --outdated
dotnet list package --vulnerable --include-transitive
dotnet list package --deprecated
```

Newer SDKs also accept `dotnet package list --outdated`.

## Pick the target

- Default: the newest LTS (see versions.md support table). An STS target only when the task asks for it or a needed feature exists only there.
- Never skip the pack reading: a jump from net8.0 to net11.0 reads net9, net10 and net11 Traps and Replace tables.
- Published libraries: add the new framework next to the old ones (`net8.0;net10.0`) unless the task says to drop consumers' framework. Applications: replace the framework.
- Leaf projects first (no project references), then upward to the hosts. Test projects move together with the project they test.

## SDK and build files

```json
{
  "sdk": { "version": "10.0.100", "rollForward": "latestFeature" }
}
```

- Update `global.json` to the target SDK band; keep the repository's `rollForward` policy.
- Change `TargetFramework` where it is declared once (`Directory.Build.props`) rather than per project when the repository centralizes it.
- Remove an explicit `LangVersion` only when it pins the old default and the task allows it; never set `preview`.
- Keep `TreatWarningsAsErrors`; new analyzer warnings are fixed or suppressed one rule at a time with a reason, never wholesale. Do not change `AnalysisLevel` unless asked (`latest` now means the target's rules).

## Packages

- Framework-coupled packages move to the major version matching the target (`Microsoft.AspNetCore.*` 10.x on net10.0, EF Core 10.x on net10.0). EF Core 11 runs only on .NET 11.
- Third-party packages: upgrade only when the current version does not support the target or is vulnerable; one package family per commit; read its release notes for breaking changes.
- Remove packages the framework now includes (e.g. a polyfill for an API the target ships); only after the build proves the in-box API is equivalent.
- Keep one version per package across the solution; with central package management, change `Directory.Packages.props` only.

## Containers, CI, hosting

- Base images: same image family and OS variant, new tag (`mcr.microsoft.com/dotnet/aspnet:8.0` -> `:10.0`; keep `-alpine`, `-noble`, `-chiseled` suffixes as they were).
- CI: update the SDK version in every pipeline that builds or tests; keep caching and test commands unchanged.
- Hosting: list every runtime setting that must change (App Service stack, Functions version, hosting bundle) in the report; do not change infrastructure you cannot see.
- Check the target's hardware or OS baseline (net11.md: x86-64-v2) against deployment hosts; report unknowns.

## Fixing the build

- Order: compile errors, then new warnings, then test failures.
- For each failure, find the matching Trap or breaking change in the packs or the official breaking-change list for the target; apply the documented fix, not a workaround.
- Overload resolution changes (C# 14 implicit spans, new `params` span overloads) can silently pick another method: review call sites the compiler flags and add tests where behavior could differ.
- Obsolete APIs (`SYSLIB*`, `ASP*` diagnostics): replace with the documented successor in a separate commit when the fix is not trivial.

## Verifying behavior

- Baseline tests on the old target first; the same tests must pass on the new target with no test edits except framework-required ones (listed in the report).
- Add characterization tests before upgrading around areas the packs flag: number conversions, serialization output, ZIP / compression, date and time, culture-sensitive formatting, OpenAPI documents, HTTP status codes.
- Compare generated contracts: serialize representative DTOs and OpenAPI documents before and after; any diff is a contract change and needs explicit approval (or a pinned option, e.g. `OpenApiSpecVersion.OpenApi3_1`).
- Run the app (or its integration tests) once on the new runtime when possible.

## Modernizing after the move (optional phase)

- Only after the retargeted build and tests are green and committed.
- Apply Replace rows from the newly loaded packs that the pack marks behavior-preserving, one idiom per commit, within the task's scope (same rules as `refactor:dotnet`).
- Everything else goes to the report as a follow-up list, grouped by pack.

## Rollback

Each phase is one commit (or a short series) that reverts cleanly: build files, packages, code fixes, containers / CI, modernization. Never mix phases in one commit.
