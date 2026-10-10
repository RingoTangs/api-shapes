# Repository Guidelines

## Project Structure & Module Organization

This repository is a TypeScript library with Zod pagination schemas. Source lives in `src/`: `index.ts` is the package entry point, `pagination.ts` defines query and response schemas, and `index.spec.ts` contains the current tests. Export intended public APIs through `src/index.ts`. `types/` is reserved for ambient declarations. `dist/` contains generated CommonJS, ESM, and type declarations; do not edit generated output. Root configuration files control TypeScript, tsdown, Vitest, ESLint, and Prettier. GitHub Actions workflows live in `.github/workflows/`.

## Build, Test, and Development Commands

Use Node.js `22.23.2` (see `.nvmrc`) and pnpm `10.24.0`.

- `pnpm install --frozen-lockfile`: install dependencies without changing the lockfile.
- `pnpm dev`: run a development build with tsdown.
- `pnpm build`: generate minified production bundles and declarations in `dist/`.
- `pnpm test`: run Vitest once in the Node environment.
- `pnpm typecheck`: check TypeScript project references.
- `pnpm check`: run lint, formatting checks, type checking, and tests.
- `pnpm check:fix`: apply ESLint and Prettier fixes; review the resulting diff.
- `pnpm pack:check`: preview npm package contents after building.

Before submitting, run `pnpm check`, `pnpm build`, and `pnpm pack:check`, matching CI.

## Coding Style & Naming Conventions

Use two-space indentation, LF endings, single quotes, no semicolons, and trailing commas as configured by Prettier. ESLint uses the Antfu TypeScript library configuration. Prefer camelCase for functions and schema values, PascalCase for types, and UPPER_SNAKE_CASE for constants, following `pagination.ts`. The `@/` alias resolves to `src/`. Infer schema types with `z.infer` where appropriate.

## Testing Guidelines

Place Vitest tests beside source files as `*.spec.ts`. Use descriptive `describe` and `it` names and assertions that verify observable behavior. For pagination changes, cover defaults, coercion, invalid inputs, and page-size boundaries. No coverage threshold is configured. Run a focused test with `pnpm exec vitest run src/index.spec.ts`.

## Commit & Pull Request Guidelines

Existing commits follow Conventional Commits, such as `feat: add pagination schema`. Use a concise, imperative subject with an appropriate prefix. Pull requests should explain the change, describe public API effects, link relevant issues, and report validation commands. Keep changes focused and update `pnpm-lock.yaml` when dependencies change.
