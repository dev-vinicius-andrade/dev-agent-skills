---
name: react
description: >
  Develop guideline for React (invoked as develop:react). Rule set for writing new React and TypeScript code
  (components, hooks, pages, forms, data fetching, bug fixes): function components with typed props, logic in
  custom hooks, local-first state, explicit loading / error / empty states, accessible markup, safe rendering,
  behavior tests with every change, and React 19 features (Compiler, Actions, useOptimistic, use(), Server
  Components) only when the installed version and framework support them. Use when asked to implement, add,
  build, extend, or fix something in a React / TypeScript frontend. For behavior-preserving restructuring use
  refactor:react instead. Not for non-React frontend code, project scaffolding, or CI work.
---

# Develop: React

Act as a senior React / TypeScript engineer writing production code. New code is born in the shape `refactor:react` would otherwise have to produce later, using only what the project's installed React version and framework support.

References, loaded when needed:

- [references/app-standards.md](references/app-standards.md) — structure, TypeScript, state and data, forms, routing, styling, performance, errors, accessibility, security, testing, docs.
- [references/clean-code.md](references/clean-code.md) — language-agnostic core rules (recipe functions, one control-flow nesting level, immutability, names).
- [references/hooks-and-state.md](references/hooks-and-state.md) — rules of hooks, effects, derived state, custom hooks, reducers, prop drilling.
- [references/patterns.md](references/patterns.md) — compound components, controlled vs uncontrolled, memoization, error boundaries, Suspense, TypeScript.
- [references/react19-features.md](references/react19-features.md) — Compiler, Actions, `useOptimistic`, `use()`, Server Components.
- [references/anti-patterns.md](references/anti-patterns.md) — what never to write.
- [references/commit-hygiene.md](references/commit-hygiene.md) — branches, commit size and format, hand-off.

## Precedence

1. Explicit instructions in the task.
2. Conventions the repository documents (`AGENTS.md`, `CLAUDE.md`, `README`, `docs/`, ESLint / Prettier / `tsconfig` settings) or consistently follows in code.
3. The defaults in this skill.

Report any default you did not apply because the repository says otherwise.

## Workflow

1. **Discover** — record: React and TypeScript versions, framework (Next.js, Remix, Vite, ...), whether the React Compiler and Server Components are enabled, router, state / data / form / styling libraries, test runner, lint / type-check / test commands. Read the docs and the **nearest existing feature of the same kind**; copy its shape.
2. **Baseline** — run type-check, lint and tests; record results and pre-existing failures.
3. **Design** — in chat, briefly: components and hooks to add, where state lives, data flow, public props / exports, tests to write. Ask before adding a dependency or changing an existing component's public API.
4. **Implement** — types first, then hooks (data and logic), then components (rendering), then wiring (routes, providers). Tests alongside each piece; for a bug fix, the failing reproduction test comes first.
5. **Verify** — type-check clean, no new lint or console warnings, all tests green, loading / error / empty states exercised.
6. **Docs** — update the feature docs, Storybook stories and any index, in the same change.
7. **Self-review** — run the Checklist; report unmet items.

## Core rules

- Function components with explicitly typed props; no `any`; discriminated unions for view states.
- Apply [clean-code.md](references/clean-code.md) to logic: components and handlers read like a recipe; one level of control-flow nesting (JSX markup excluded); early returns for loading / error / empty; intent names; no narrating comments.
- One responsibility per component and hook. Data and stateful logic in `use*` hooks; components render.
- Rules of hooks; complete dependency arrays; never silence `exhaustive-deps`.
- State local first, derived when possible, colocated. Server state through the project's data library. No new state library without approval.
- Effects only to synchronize with external systems; they clean up and ignore stale results.
- Never mutate props, state or arguments.
- Stable unique keys; refs instead of direct DOM access.
- Accessible by default: semantic elements, labels, keyboard support, focus management.
- Never render untrusted HTML unsanitized; no secrets in client code.
- Version-gated features (Actions, `useOptimistic`, `use()`, RSC, Compiler) only when installed and enabled. Manual memoization only without the Compiler and with evidence.
- Existing components' public props and exports are frozen; additions are backward compatible.

## Checklist

- [ ] Followed the shape of the nearest existing feature; repo conventions respected (conflicts reported).
- [ ] No new dependency without approval; one styling system; project's data / form / router libraries used.
- [ ] Props and state typed explicitly; no `any`; external data validated at the boundary.
- [ ] Each component and hook has one responsibility; logic follows clean-code.md.
- [ ] Rules of hooks hold; dependency arrays complete; effects clean up and ignore stale results.
- [ ] No mirrored / derived state; state colocated; no prop drilling through uninterested components.
- [ ] Loading, error, empty and ready states handled; error boundary around independent regions.
- [ ] Keys stable; no direct DOM manipulation; no render-phase state updates.
- [ ] Accessible: semantic markup, labels, keyboard, focus, contrast.
- [ ] No unsanitized HTML, unsafe URLs or client-side secrets.
- [ ] React 19 / RSC features only where supported; memoization only with evidence.
- [ ] Behavior tests for every new component, hook and interaction; bug fixes start with a reproducing test; all green.
- [ ] Existing public component APIs unchanged; docs and stories updated.
- [ ] Commits follow commit-hygiene (or the repository's rules).

## Final report

Discovery summary (one line each), what was added (components, hooks, routes), public API additions, dependencies added (with approval), tests before / after, docs touched, unmet checklist items, defaults overridden by repository conventions.
