<!-- GENERATED from shared/react/react19-features.md by scripts/sync-shared.mjs. Edit the source, then re-run the script. -->

# React 19 Features

Use a feature only when the installed React version and the framework support it (check `package.json`, the framework docs, the build config). Illustrative names only.

## React Compiler (automatic memoization)

When the compiler is installed and enabled, it memoizes components and values automatically; remove manual `useMemo` / `useCallback` only after confirming it is on. React 19 alone does not enable it.

```tsx
// With the React Compiler enabled: no useCallback / useMemo needed.
function ProductList({ products, onSelect }: ProductListProps) {
  const handleSelect = (id: string) => onSelect(id);
  const sortedProducts = [...products].sort(byName);

  return sortedProducts.map((product) => (
    <ProductCard key={product.id} product={product} onSelect={handleSelect} />
  ));
}
```

Without the compiler, add manual memoization only when profiling or a memoized child shows a real benefit (see patterns.md).

## Actions and form handling

Replace hand-rolled pending / error state with `useActionState`.

```tsx
// Before: manual form handling
function ContactForm() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);
    try {
      await saveContact(new FormData(event.currentTarget));
    } catch (caught) {
      setError(caught as Error);
    } finally {
      setIsPending(false);
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}

// After: Actions (React 19)
async function submitContact(previousState: ContactState, formData: FormData) {
  return saveContact(formData);
}

function ContactForm() {
  const [state, formAction, isPending] = useActionState(submitContact, initialContactState);

  return (
    <form action={formAction}>
      {state.error && <ErrorMessage error={state.error} />}
      <SubmitButton pending={isPending} />
    </form>
  );
}
```

Actions work with uncontrolled inputs read from `FormData`; do not convert such forms to controlled inputs just for style.

## useOptimistic

Immediate UI feedback while an async action runs; the optimistic state is discarded when the action settles.

```tsx
function TodoList({ todos, addTodo }: TodoListProps) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (current, newTodo: Todo) => [...current, { ...newTodo, pending: true }],
  );

  async function addTodoAction(formData: FormData) {
    const newTodo = { id: crypto.randomUUID(), text: String(formData.get('text')) };
    addOptimisticTodo(newTodo);
    await addTodo(newTodo);
  }

  return (
    <form action={addTodoAction}>
      <ul>
        {optimisticTodos.map((todo) => (
          <li key={todo.id} style={{ opacity: todo.pending ? 0.5 : 1 }}>{todo.text}</li>
        ))}
      </ul>
    </form>
  );
}
```

Call the optimistic setter inside an Action or `startTransition`.

## use() for promises and context

```tsx
function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise);
  return <h1>{user.name}</h1>;
}

function UserPage({ userPromise }: { userPromise: Promise<User> }) {
  return (
    <Suspense fallback={<Loading />}>
      <UserProfile userPromise={userPromise} />
    </Suspense>
  );
}
```

The promise must be created or cached by a stable owner (framework loader, server component, cache); never create it inline during render. `use(Context)` may be called conditionally, unlike `useContext`.

## Server Components (RSC)

Only in frameworks that support them. Keep data access on the server and client boundaries small and interactive.

```tsx
// ProductPage.tsx (server component)
async function ProductPage({ id }: { id: string }) {
  const product = await getProduct(id);

  return (
    <div>
      <h1>{product.name}</h1>
      <ProductDescription text={product.description} />
      <AddToCartButton productId={id} />
    </div>
  );
}
```

```tsx
// AddToCartButton.tsx — the directive is the first line of its own file
'use client';

export function AddToCartButton({ productId }: { productId: string }) {
  const [quantity, setQuantity] = useState(1);
  return <button onClick={() => addToCart(productId, quantity)}>Add {quantity} to cart</button>;
}
```

Move `'use client'` as deep as possible; pass server data down as serializable props.

## Sources

- [React 19 release notes](https://react.dev/blog/2024/12/05/react-19)
- [Server Components reference](https://react.dev/reference/rsc/server-components)
- [React Compiler](https://react.dev/learn/react-compiler)
