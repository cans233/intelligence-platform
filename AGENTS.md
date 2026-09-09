# Repository Guidelines

## Project Structure & Module Organization

The working application lives in `frontend/`, a React 19 and TypeScript project built with Vite. Keep routed screens in `frontend/src/pages/`, reusable UI in `frontend/src/components/`, and domain request wrappers in `frontend/src/api/`. Shared data shapes belong in `frontend/src/types.ts`; Contract Mock data and helpers belong in `frontend/src/mocks.ts`. Tests are colocated with the code they exercise as `*.test.ts` or `*.test.tsx`.

Product analysis and task sequencing live in `docs/`. The `backend/`, `contracts/`, `deploy/`, `migrations/`, `search/`, `tests/`, and `workers/` directories are currently placeholders; do not add speculative infrastructure there.

## Build, Test, and Development Commands

Run frontend commands from `frontend/` and use the pinned pnpm version:

```bash
pnpm install    # Install dependencies.
pnpm dev        # Start Vite's local development server.
pnpm test       # Run the Vitest suite once.
pnpm build      # Type-check and create the production bundle.
pnpm preview    # Serve the built bundle for a final check.
```

There is no configured lint command. Do not claim lint validation unless a linter is added deliberately.

## Coding Style & Naming Conventions

Follow the existing TypeScript style: two-space indentation, single quotes, no semicolons, and trailing commas in multiline constructs. TypeScript runs in strict mode. Name React components and files with `PascalCase` (`SearchResultCard.tsx`), variables and functions with `camelCase`, and domain API modules with lowercase names (`api/patent.ts`). Keep page components focused and reuse existing state and layout components before adding new abstractions.

All page data should pass through `src/api/`. Preserve the shared response shape (`code`, `data`, `message`, `trace_id`) and keep the current Contract Mock boundary until real `/api/v1` services are approved.

## Testing Guidelines

Vitest runs in `jsdom`. Add one focused regression test for non-trivial logic, routing, or Mock behavior. Prefer user-visible assertions over implementation details. No coverage threshold is currently enforced. Before opening a PR, run both `pnpm test` and `pnpm build`.

## Git Workflow

Follow [`docs/git-workflow.md`](docs/git-workflow.md) for branch naming, commit structure, PR content, validation, and `main` branch rules. Before any commit or push, present a segmented commit plan in Chinese and wait for the user's approval.
