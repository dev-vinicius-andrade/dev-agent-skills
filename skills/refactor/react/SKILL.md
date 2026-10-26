---
name: react
description: >
  Refactor guideline for React (invoked as refactor:react). Behavior-preserving refactoring of React and
  TypeScript components, hooks, and state flows: split god components, extract custom hooks, remove prop
  drilling, fix effect and key misuse, tighten types, and adopt React 19 features (Compiler, Actions,
  useOptimistic, use(), Server Components) only when the installed version and framework support them. Use
  when asked to refactor, clean up, simplify, or fix re-renders and hook misuse in React / TypeScript code.
  For new features or bug fixes use develop:react. Not for non-React frontend code or greenfield application setup.
---

# Refactor: React

Act as a senior React / TypeScript engineer. Goal: clearer, more correct components with **no observable behavior change**, using only what the project's installed React version and framework support. Prefer the smallest refactoring that improves clarity or correctness.

References, loaded when needed:

- [references/clean-code.md](references/clean-code.md) — language-agnostic core rules (recipe functions, one control-flow nesting level, immutability, names).
- [references/hooks-and-state.md](references/hooks-and-state.md) — rules of hooks, effects, derived state, custom hooks, reducers, prop drilling.
- [references/patterns.md](references/patterns.md) — compound components, controlled vs uncontrolled, render props to hooks, memoization, error boundaries, Suspense, TypeScript.
- [references/react19-features.md](references/react19-features.md) — Compiler, Actions, `useOptimistic`, `use()`, Server Components.
- [references/anti-patterns.md](references/anti-patterns.md) — what to look for and the behavior-preserving fix.
- [references/commit-hygiene.md](references/commit-hygiene.md) — branches, commit size and format, hand-off.

## Precedence

1. Explicit instructions in the task.
2. Conventions the repository documents (`AGENTS.md`, `CLAUDE.md`, `README`, `docs/`, ESLint / Prettier / `tsconfig` settings) or consistently follows in code.
3. The defaults in this skill.

Report any default you did not apply because the repository says otherwise.

## Workflow

1. **Discover** — record: React and TypeScript versions (`package.json`), framework (Next.js, Remix, Vite, ...), whether the React Compiler and Server Components are enabled, state and data libraries in use, styling approach, lint / type-check / test commands, and the established component patterns. Never assume React 19 APIs, the Compiler or RSC are available.
2. **Analyze** — for each component in scope: purpose, responsibilities (data fetching, state, rendering, events), props, state, effects, smells (anti-patterns.md). Output a short Analysis Summary ranked by impact.
3. **Baseline** — run type-check, lint and tests; record results. Add tests (React Testing Library or the project's tool) for behavior you will move and that is not covered.
4. **Plan** — in chat: which components split, which hooks extracted, state restructuring, type improvements, risk per step.
5. **Execute** — one concern per commit, in this order: extract custom hooks -> split components -> fix anti-patterns -> tighten types -> adopt version-gated features -> memoization (only with evidence and only without the Compiler).
6. **Verify** — after each step: type-check clean, no new lint warnings or console warnings, tests green, loading / error / empty states still behave the same.
7. **Self-review** — run the Checklist; report unmet items.

## Core rules

- Apply [clean-code.md](references/clean-code.md) to logic: component bodies and handlers read like a recipe; one level of control-flow nesting (JSX markup excluded); early returns for loading / error / empty states; intent names; no narrating comments.
- One responsibility per component and per hook. Data and stateful logic go into `use*` hooks; components render.
- Follow the rules of hooks; complete dependency arrays; never silence `exhaustive-deps`.
- Derive instead of store: no state mirroring props or other state; no effect to sync props into state (reset with `key`).
- Effects only to synchronize with external systems; event logic stays in handlers; effects clean up.
- Never mutate props, state or arguments; produce new objects and arrays.
- Prop drilling: composition first, then context, then the project's existing store. Never add a state library for local state.
- Keys stable and unique, never the array index for dynamic lists.
- No direct DOM access; use refs.
- TypeScript: explicit prop types, union / discriminated types for variants, no `any`, extend native element props.
- Memoize manually only when the Compiler is off and profiling shows a benefit.
- Version-gated features (Actions, `useOptimistic`, `use()`, RSC, Compiler) only when installed and enabled.
- Do not change public component APIs (props, exports) or rendered output unless the task says so.

## Checklist

- [ ] Discovery recorded (versions, framework, Compiler / RSC status, libraries); repo conventions respected.
- [ ] Each component and hook has one responsibility; logic follows clean-code.md.
- [ ] Rules of hooks hold; dependency arrays complete; effects clean up.
- [ ] No mirrored / derived state; no prop-to-state sync effects.
- [ ] State colocated; composition / context used according to ownership; no new state library without approval.
- [ ] Keys stable and unique; no direct DOM manipulation; no render-phase state updates.
- [ ] Types explicit and accurate; no `any`.
- [ ] Error boundaries and Suspense where supported and appropriate; loading and error states handled.
- [ ] Memoization only with evidence and only without the Compiler.
- [ ] React 19 / RSC features used only where the project supports them.
- [ ] Type-check, lint and tests green; behavior unchanged.
- [ ] Commits follow commit-hygiene (or the repository's rules).

## When to stop

Stop when each component has one clear responsibility, state is colocated, props are minimal, no listed smell remains, types are clean and tests pass. Further changes without evidence of a problem are premature optimization.

## Final report

Analysis Summary, changes made (bulleted, per component / hook), rationale for each non-obvious change, verification results, unmet checklist items, and repository conventions that overrode a default.
