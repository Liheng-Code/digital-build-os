# Project Overview

This is a React Single-Page Application (SPA) built using Vite and TypeScript. Based on its structure and dependencies, it utilizes the `shadcn/ui` pattern alongside Radix UI primitives and Tailwind CSS for UI components. It interfaces with Supabase for its backend/database services and uses TanStack React Query for data fetching and state management.

## Tech Stack & Core Libraries
- **Framework:** React 18, Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS, `clsx`, `tailwind-merge`, `tailwindcss-animate`
- **UI Components:** Radix UI primitives, `lucide-react` (icons)
- **Routing:** `react-router-dom`
- **Data Fetching:** `@tanstack/react-query`
- **Backend/BaaS:** `@supabase/supabase-js`
- **Forms & Validation:** `react-hook-form`, `zod`, `@hookform/resolvers`
- **Charts:** `recharts`
- **Testing:** `vitest`, `@testing-library/react`

## Building and Running

You can use `npm` or `bun` (the project contains `bun.lockb` and `package-lock.json`).

- **Development Server:**
  ```bash
  npm run dev
  ```
  *Note: The Vite dev server is configured to run on port `8080` (`http://localhost:8080`).*

- **Production Build:**
  ```bash
  npm run build
  ```

- **Preview Production Build:**
  ```bash
  npm run preview
  ```

- **Testing:**
  ```bash
  npm run test        # Runs Vitest once
  npm run test:watch  # Runs Vitest in watch mode
  ```

- **Linting:**
  ```bash
  npm run lint
  ```

## Development Conventions

- **Path Aliasing:** The `@` symbol is aliased to the `./src` directory. Use absolute imports like `import Component from "@/components/Component"`.
- **Linting Rules:** The ESLint configuration is set up for TypeScript and React Hooks. Notably, the rule `@typescript-eslint/no-unused-vars` is currently turned **off**.
- **Lovable Integration:** The project utilizes the `lovable-tagger` Vite plugin (`componentTagger`) in development mode, indicating it was scaffolded or is managed by the Lovable platform.
