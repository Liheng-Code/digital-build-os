# AGENTS.md — DCOS Construction Management Platform

## Build / Lint / Test Commands

```bash
npm run dev           # Start Vite dev server (port 8080, HMR overlay off)
npm run build         # Production build (vite build)
npm run build:dev     # Dev-mode build (vite build --mode development)
npm run preview       # Preview production build
npm run lint          # ESLint check (targets **/*.{ts,tsx})
npm run test          # Vitest run (all src/**/*.{test,spec}.{ts,tsx})
npm run test:watch    # Vitest watch mode
npx vitest run src/path/to/file.test.ts  # Single test file
npx vitest run -t "test name"            # Single test by name pattern
```

## Project Architecture

- **Framework**: React 18 + TypeScript 5.8 + Vite 5 + SWC
- **Routing**: react-router-dom v6 (BrowserRouter)
- **Styling**: Tailwind CSS 3.4 + shadcn/ui + CSS variables (HSL semantic tokens)
- **State / Data**: @tanstack/react-query v5 + Supabase JS client (typed)
- **Forms**: react-hook-form + zod validation
- **Testing**: Vitest + jsdom + @testing-library/react + @testing-library/jest-dom
- **Toasts**: sonner (primary) + shadcn/ui Toaster (legacy)

## Directory Structure

```
src/
  lib/             # Type definitions, meta/constants, utility functions (*Meta.ts)
  services/        # Supabase query functions (*Service.ts)
  hooks/           # Custom React hooks (use*)
  contexts/        # AuthContext, ProjectContext
  components/      # Shared UI components
    ui/            # shadcn/ui primitives (button, dialog, card, etc.)
  pages/           # Route-level page components
  integrations/    # Third-party (supabase/client.ts, supabase/types.ts)
  test/            # Test setup (setup.ts)
  tests/           # Integration tests
```

## Code Style Guidelines

### Imports (order)
1. `import * as React from "react"` (standard)
2. Third-party libs (`react-router-dom`, `@supabase/supabase-js`, `lucide-react`, `sonner`, `date-fns`)
3. `@/` path alias imports (project modules)
4. Relative imports (only for same-directory siblings when necessary)

### Formatting
- Double quotes for strings and JSX attributes
- Semicolons required
- 2-space indentation
- No trailing commas in multi-line arrays/objects (inconsistent, follow file)
- Prefer `const` over `let` or `var`

### Types & Interfaces
- Define types/interfaces locally in the file or in `src/lib/*Meta.ts`
- String literal union types instead of enums (e.g. `type TaskStatus = "open" | "assigned" | ...`)
- `Record<UnionType, string>` for label maps (e.g. `TASK_STATUS_LABELS`)
- `Record<UnionType, { bg: string; fg: string; dot: string }>` for status tone maps
- `Record<UnionType, UnionType[]>` for status flow transition maps
- Nullable fields: `field: Type | null`
- Interface names: PascalCase (e.g. `TaskRow`, `WbsTreeNode`)
- Type names: PascalCase prefixed with context (e.g. `TaskStatus`, `MrStatus`)

### Naming Conventions
- **Files**: camelCase (e.g. `taskMeta.ts`, `invoiceService.ts`)
- **React components**: PascalCase, file = component name (e.g. `Tasks.tsx` → `export default function Tasks()`)
- **Hooks**: `use*` camelCase (e.g. `useAuth`, `useTaskUnread`)
- **Contexts**: PascalCase with `Context` suffix (e.g. `AuthContext`, `ProjectContext`)
- **Constants/Labels**: UPPER_SNAKE_CASE (e.g. `TASK_STATUS_LABELS`, `KANBAN_COLUMNS`)
- **Services/functions**: camelCase (e.g. `fetchInvoices`, `createInvoiceItem`)
- **CSS classes**: Tailwind utility classes only; never custom class names

### Page Component Pattern
```tsx
export default function PageName() {
  const { user } = useAuth();
  const { activeProject } = useProjects();
  const [loading, setLoading] = React.useState(true);
  // ... component body
}
```

### Error Handling
- **User-facing errors**: `toast.error("message")` (from `sonner`)
- **Data-fetching errors**: `if (error) throw error` in service functions
- **Form validation**: early returns with `toast.error()` before mutations
- **Supabase mutations**: check `result.error` and show `toast.error(result.error.message)`

### Supabase Data Access
- Typed client from `@/integrations/supabase/client` as `supabase`
- Service functions: async functions that `throw error` on failure
- Components call services directly or through custom hooks
- Use `(supabase as any)` cast for dynamic table access in tests

### Testing Conventions
```tsx
import { describe, it, expect } from "vitest";
describe("Module name", () => {
  it("should do something", async () => {
    // ...
  });
});
```

### Tailwind / CSS
- Only use semantic CSS tokens (`bg-primary`, `text-muted-foreground`, `bg-info-soft`, etc.)
- Never hardcode colors — use `var(--*)` HSL tokens defined in `src/index.css`
- Use `cn()` utility from `@/lib/utils` (clsx + tailwind-merge) for conditional classes
- shadcn/ui components in `src/components/ui/` — modify sparingly

### Routing Pattern
```tsx
<Route
  path="/feature"
  element={
    <ProtectedRoute>
      <AppLayout>
        <PageComponent />
      </AppLayout>
    </ProtectedRoute>
  }
/>
```
