---
name: stack-name
description: >
  <Action> guideline for <stack> (invoked as <action>:<stack>). What this skill does in one sentence.
  Use when asked to <trigger phrases>. For <neighboring scope> use <other-action>:<stack> instead.
  Not for <out-of-scope work>.
---

# <Action>: <Stack>

Role and goal in one or two sentences.

References, loaded when needed:

- [references/clean-code.md](references/clean-code.md) — language-agnostic core rules (shared; add `core/clean-code.md` to `shared/manifest.json`).
- [references/commit-hygiene.md](references/commit-hygiene.md) — branches and commits (shared; add `core/commit-hygiene.md`).
- [references/example.md](references/example.md) — stack-only recipes this skill owns.

## Precedence

1. Explicit instructions in the task.
2. Conventions the target repository documents (`AGENTS.md`, `CLAUDE.md`, `README`, `docs/`, linters, editor config) or consistently follows in code.
3. The defaults in this skill.

Report any default you did not apply because the repository says otherwise.

## Workflow

1. **Discover** — how to learn the target repository before acting (versions, structure, conventions, commands).
2. **Baseline** — how to prove the current state (build, tests).
3. **Plan** — what the plan must contain.
4. **Execute** — how to make changes, in which order.
5. **Verify** — what must hold after every step.
6. **Self-review** — run the Checklist.

## Core rules

- Short, imperative, checkable. The strongest rules only; detail goes in references.

## Checklist (run before finishing)

- [ ] ...
- [ ] Commits follow commit-hygiene (or the repository's rules).

## Final report

What the last message must contain.
