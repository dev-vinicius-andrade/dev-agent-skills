# Anti-Patterns to Refactor

Each entry: what to look for, and the behavior-preserving fix. Illustrative names only.

## Array index as key

```tsx
// BAD: reorders and inserts mix up state between rows
{items.map((item, index) => <Row key={index} {...item} />)}

// GOOD: stable, unique id
{items.map((item) => <Row key={item.id} {...item} />)}
```

## Props copied into state

```tsx
// BAD: state ignores later prop changes
function UserForm({ user }: { user: User }) {
  const [name, setName] = useState(user.name);
}

// GOOD: reset by identity
<UserForm key={user.id} user={user} />

// GOOD: if the value never needs local edits, read the prop directly
```

Do not "sync" with an effect (`useEffect(() => setName(user.name), [user.name])`): it renders stale values first and overwrites local edits.

## Mirrored or derived state

State that can be computed from props or other state is computed during render (see hooks-and-state.md).

## Direct DOM manipulation

```tsx
// BAD
useEffect(() => { document.getElementById('search')?.focus(); }, []);

// GOOD
const searchInputRef = useRef<HTMLInputElement>(null);
useEffect(() => { searchInputRef.current?.focus(); }, []);
return <input ref={searchInputRef} />;
```

## Inline objects and arrays where identity matters

```tsx
// A new reference each render defeats memo() or re-runs an effect that depends on it
<Chart style={{ height: 300 }} series={[revenue, cost]} />

// Hoist constants out of the component; memoize computed ones only with evidence
const chartStyle = { height: 300 };
```

Only matters when the receiver is memoized or uses the value as an effect dependency.

## State updates during render

```tsx
// Avoid: render-phase setState (React re-renders immediately; hard to follow)
function Counter({ value }: { value: number }) {
  const [count, setCount] = useState(0);
  if (value !== count) setCount(value);
  return <div>{count}</div>;
}

// Prefer: derive, or reset with a key
function Counter({ value }: { value: number }) {
  return <div>{value}</div>;
}
```

## Effects for events

Logic that responds to a user action belongs in the event handler, not in an effect watching a flag set by that handler.

## God components

One component fetching, transforming, holding form state and rendering several sections: extract a data hook, pure transform functions, and child components per section.
