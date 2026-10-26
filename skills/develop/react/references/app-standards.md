# App Standards for New React Code

Defaults for areas the shared references do not cover. The repository's existing choice always wins: never add a library when one already fills the role, and ask before adding a new one. Illustrative names only.

## Structure

- Organize by feature or domain (`features/orders/`, `features/billing/`), not by file type, unless the repository already does otherwise.
- A feature folder holds its components, hooks, types, API calls and tests; shared building blocks live in a common `components/` / `hooks/` / `lib/`.
- PascalCase for components and their files, camelCase for functions and hooks (`useOrderTotals`), `use` prefix only on real hooks.
- One exported component per file; small private helpers may sit beside it.
- Container / presentational split where it helps testing: hooks own data, components render.

## TypeScript

- `strict` on. Explicit prop interfaces, union literal types for variants, discriminated unions for states (`{ status: 'loading' } | { status: 'error'; error: Error } | { status: 'ready'; data: Order[] }`).
- Type event handlers and refs (`React.ChangeEvent<HTMLInputElement>`, `useRef<HTMLDivElement>(null)`).
- Extend native element props (`React.ComponentProps<'button'>`) instead of re-declaring them.
- Prefer plain function components with typed props over `React.FC`.
- No `any`; validate external data at the boundary (schema library already in the project, or a type guard).

## State and data

- Local first: `useState`, then `useReducer` for related state, then context, then the project's store. Server state belongs to the project's data library (TanStack Query, SWR, Apollo, framework loaders), not to global client state.
- Every async view handles loading, error, empty and ready states explicitly.
- Cancel or ignore stale requests (`AbortController`, the library's cancellation); never set state after unmount or for an outdated request.
- Optimistic updates only with a rollback path (`useOptimistic` or the library's mechanism).
- Normalize nested server data when several views edit the same entities.

## Forms

- Use the project's form approach. Without one: React 19 Actions + `FormData` where supported, otherwise a form library already in the project, otherwise controlled inputs.
- Every input has a `<label>` (or `aria-label`); errors are linked with `aria-describedby` and announced.
- Validate on the client for feedback and on the server for truth; debounce expensive live validation.
- Disable or mark pending submit buttons while an action runs; prevent double submits.

## Routing

- Use the project's router or framework routing. Lazy-load route components (`lazy` + `Suspense`) for code splitting.
- Read params and query strings through the router's typed helpers; never parse `window.location` by hand.
- Guard protected routes in one place (layout route, loader, middleware), not in every page.

## Styling

- Keep the project's styling system (CSS Modules, Tailwind, CSS-in-JS, design-system components). Never mix in a second one.
- Use design tokens / CSS custom properties for color, spacing and typography; no hard-coded magic values.
- Mobile-first, responsive layouts; respect `prefers-reduced-motion` and `prefers-color-scheme` where the design supports them.

## Performance

- Clear code first; measure with React DevTools Profiler before optimizing.
- Code-split routes and heavy, rarely used components.
- Virtualize long lists; lazy-load below-the-fold images (`loading="lazy"`, explicit `width` / `height`).
- Memoize manually only without the React Compiler and only with evidence (patterns.md).

## Error handling

- Error boundaries around independent regions (route, widget), with a useful fallback and a reset path.
- Errors in event handlers and async code are caught where they happen and surfaced to the user; boundaries do not see them.
- Report errors through the project's logger / monitoring, never `console.log` left in code.
- User-facing messages say what happened and what to do; technical detail goes to logs.

## Accessibility

- Semantic elements first (`button`, `nav`, `main`, `ul`); ARIA only to fill gaps, never on top of a correct native element.
- Every interactive element works with the keyboard and has a visible focus state; manage focus on route changes and dialogs.
- Images have `alt` (empty for decorative); icon-only buttons have an accessible name.
- Color contrast meets WCAG AA; information is never conveyed by color alone.

## Security

- Never render untrusted HTML; if unavoidable, sanitize (e.g. DOMPurify) before `dangerouslySetInnerHTML`.
- Never build URLs for `href` / `src` from user input without validating the scheme (`javascript:` links).
- No secrets in client code or `VITE_` / `NEXT_PUBLIC_`-style public env vars.
- Tokens: follow the project's auth approach; prefer httpOnly cookies over `localStorage` for session tokens.
- HTTPS for all external calls; keep dependencies audited.

## Testing

- Use the project's runner (Vitest, Jest) and React Testing Library (or the project's equivalent).
- Test behavior through what the user sees and does: query by role and label, interact with `user-event`, assert on output. No testing of implementation details (state, internal methods).
- Every new component or hook: ready, loading, error and empty states; each user interaction; edge inputs.
- Mock the network at the boundary (MSW or the project's approach), not internal modules.
- Bug fix: first a failing test that reproduces the bug, then the fix.
- Include an accessibility assertion where the project has tooling (`jest-axe`, Testing Library role queries).

## Documentation

- JSDoc on exported components and hooks whose contract is not obvious from types (side effects, required providers).
- Update the feature's README or docs and any Storybook stories together with the code.
