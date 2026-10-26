<!-- GENERATED from shared/react/patterns.md by scripts/sync-shared.mjs. Edit the source, then re-run the script. -->

# Component Patterns, Memoization, Errors, TypeScript

Illustrative names only.

## Compound components

Related components that share implicit state through context.

```tsx
<Tabs defaultValue="details">
  <Tabs.List>
    <Tabs.Trigger value="details">Details</Tabs.Trigger>
    <Tabs.Trigger value="history">History</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="details">...</Tabs.Content>
  <Tabs.Content value="history">...</Tabs.Content>
</Tabs>
```

```tsx
const TabsContext = createContext<TabsState | null>(null);

function Tabs({ children, defaultValue }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}

Tabs.Trigger = function TabsTrigger({ children, value }: TabsTriggerProps) {
  const { activeTab, setActiveTab } = useTabsContext();
  return (
    <button aria-selected={activeTab === value} onClick={() => setActiveTab(value)}>
      {children}
    </button>
  );
};

Tabs.Content = function TabsContent({ children, value }: TabsContentProps) {
  const { activeTab } = useTabsContext();
  return activeTab === value ? <div role="tabpanel">{children}</div> : null;
};
```

## Controlled vs uncontrolled

- Controlled (`value` + `onChange`) when the UI reacts to every keystroke: live validation, dependent fields, formatting.
- Uncontrolled + `FormData` (or a form library) when values are read only on submit; this is the natural fit for React 19 Actions.
- Never switch an input between controlled and uncontrolled during its lifetime.

## Render props and HOCs to hooks

```tsx
// Before
<MousePosition>{({ x, y }) => <Cursor x={x} y={y} />}</MousePosition>

// After
function useMousePosition() {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (event: MouseEvent) => setPosition({ x: event.clientX, y: event.clientY });
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return position;
}
```

## Manual memoization (only without the compiler, only with evidence)

```tsx
const ExpensiveList = memo(function ExpensiveList({ items, onSelect }: ExpensiveListProps) {
  return items.map((item) => <ExpensiveItem key={item.id} item={item} onSelect={onSelect} />);
});

function DataTable({ rows, sortConfig }: DataTableProps) {
  const sortedRows = useMemo(() => sortRows(rows, sortConfig), [rows, sortConfig]);
  return <Table rows={sortedRows} />;
}

function Parent({ id }: { id: string }) {
  const handleClick = useCallback(() => trackClick(id), [id]);
  return <MemoizedChild onClick={handleClick} />;
}
```

Extract the comparison or sort logic into a pure function (`sortRows`) rather than nesting it inside `useMemo`. `useCallback` matters only when the receiver is memoized or the function is an effect dependency.

## Error boundaries and Suspense

Error boundaries catch errors thrown while rendering, not errors in event handlers or unawaited async code. Use the project's boundary (or `react-error-boundary`) before writing a class.

```tsx
class ErrorBoundary extends Component<ErrorBoundaryProps, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(error, info);
  }

  render() {
    if (this.state.error) return <ErrorFallback error={this.state.error} />;
    return this.props.children;
  }
}
```

```tsx
<ErrorBoundary>
  <Suspense fallback={<PagePlaceholder />}>
    <Header />
    <Suspense fallback={<ContentPlaceholder />}>
      <MainContent />
    </Suspense>
  </Suspense>
</ErrorBoundary>
```

Nest Suspense boundaries so independent regions load independently.

## TypeScript

```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

function Button({ variant, size = 'md', className, ...buttonProps }: ButtonProps) {
  return <button className={clsx('btn', `btn-${variant}`, `btn-${size}`, className)} {...buttonProps} />;
}
```

```tsx
interface ListProps<TItem> {
  items: readonly TItem[];
  renderItem: (item: TItem) => React.ReactNode;
  keyOf: (item: TItem) => string;
}

function List<TItem>({ items, renderItem, keyOf }: ListProps<TItem>) {
  return <ul>{items.map((item) => <li key={keyOf(item)}>{renderItem(item)}</li>)}</ul>;
}
```

- Explicit prop interfaces; union literal types for variants and states; discriminated unions for mutually exclusive props.
- Extend native element props instead of re-declaring them.
- No `any`; `unknown` + narrowing at boundaries. Keep `strict` on.

Further reading: [patterns.dev — React](https://www.patterns.dev/react/).
