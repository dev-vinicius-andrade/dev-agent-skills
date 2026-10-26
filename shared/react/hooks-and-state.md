# Hooks and State

Illustrative names only.

## Rules of hooks

1. Call hooks only at the top level of a component or custom hook — never in loops, conditions, or nested functions.
2. Call hooks only from components or custom hooks.
3. Dependency arrays list every reactive value used; follow `react-hooks/exhaustive-deps`, never silence it.

## Effects

Effects synchronize with external systems (subscriptions, DOM APIs, network). Derived values, event responses and prop-to-state copies do not need an effect.

```tsx
// BAD: missing dependency
useEffect(() => { fetchData(userId); }, []);

// GOOD
useEffect(() => { fetchData(userId); }, [userId]);

// CAUTION: an object recreated every render re-runs the effect every render
useEffect(() => { search(options); }, [options]);

// GOOD: build the object inside the effect, depend on its inputs
useEffect(() => { search({ sortBy, filterBy }); }, [sortBy, filterBy]);

// GOOD: clean up subscriptions
useEffect(() => {
  const subscription = subscribeToData(id);
  return () => subscription.unsubscribe();
}, [id]);
```

Fetching in effects needs cleanup against races (an `ignore` flag or `AbortController`). Prefer the project's data library (TanStack Query, SWR, framework loaders) when one exists.

## Derive instead of store

```tsx
// BAD: state + effect mirroring other state
const [fullName, setFullName] = useState('');
useEffect(() => setFullName(`${firstName} ${lastName}`), [firstName, lastName]);

// GOOD: compute during render
const fullName = `${firstName} ${lastName}`;
```

## Extract custom hooks

Move stateful logic that has one purpose into a `use*` hook; the component keeps rendering only.

```tsx
function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    fetchUser(userId)
      .then((loaded) => { if (!ignore) setUser(loaded); })
      .catch((caught) => { if (!ignore) setError(caught); })
      .finally(() => { if (!ignore) setIsLoading(false); });
    return () => { ignore = true; };
  }, [userId]);

  return { user, error, isLoading };
}

function UserProfile({ userId }: { userId: string }) {
  const { user, error, isLoading } = useUser(userId);
  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  return <ProfileCard user={user} />;
}
```

## useReducer for related state

Several `useState` calls updated together become one reducer with named actions. Keep the reducer pure; one handler per action keeps nesting flat.

```tsx
type CartAction =
  | { type: 'itemAdded'; item: CartItem }
  | { type: 'discountApplied'; amount: number };

const cartReducer = (cart: Cart, action: CartAction): Cart => {
  switch (action.type) {
    case 'itemAdded':
      return addItem(cart, action.item);
    case 'discountApplied':
      return { ...cart, discount: action.amount };
  }
};

const addItem = (cart: Cart, item: CartItem): Cart => ({
  ...cart,
  items: [...cart.items, item],
  total: cart.total + item.price,
});
```

## Prop drilling: composition first, then context, then a store

```tsx
// BAD: props threaded through components that do not use them
<Layout user={user} setUser={setUser} />

// 1. Composition: pass the consumer as children
<Layout>
  <Sidebar>
    <UserMenu user={user} onLogout={logout} />
  </Sidebar>
</Layout>
```

```tsx
// 2. Context for widely shared, slowly changing values (theme, auth, locale)
const UserContext = createContext<UserContextValue | null>(null);

function useUserContext() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUserContext must be used within UserProvider');
  return context;
}
```

3. A store (Zustand, Redux Toolkit, ...) only for state shared across unrelated parts of the app, and only the one the project already uses or the team approves. Never add a library for state that can stay local.

Colocate state: keep each piece as close as possible to where it is used.
