# Repository Guidelines

Lightweight, framework-agnostic API schemas and types powered by Zod, intended for distribution as an npm package.

## Project Structure & Module Organization

Source lives in `src/`: `index.ts` is the package entry point, `pagination.ts` provides the current pagination schemas, and `index.spec.ts` contains tests. Export intended public APIs through `src/index.ts`. `types/` is reserved for ambient declarations. `dist/` contains generated CommonJS, ESM, and type declarations; do not edit generated output. Build and tooling configurations live at the root; CI and publishing workflows live in `.github/workflows/`.

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

Keep schemas reusable and framework-agnostic; avoid framework dependencies and unnecessary runtime dependencies. Derive TypeScript types with `z.infer` instead of duplicating schema definitions. Use two-space indentation, LF endings, single quotes, no semicolons, and trailing commas as configured by Prettier. ESLint uses the Antfu TypeScript library configuration. Use camelCase for functions and schemas, PascalCase for types, and UPPER_SNAKE_CASE for constants. The `@/` alias resolves to `src/`.

## Testing Guidelines

Place Vitest tests beside source files as `*.spec.ts`. Use descriptive `describe` and `it` names. Cover valid and invalid inputs, defaults, coercion, and boundary behavior; pagination tests should include page-size limits. Check inferred types through TypeScript when changing schema contracts. No coverage threshold is configured. Run a focused test with `pnpm exec vitest run src/index.spec.ts`.

## Commit & Pull Request Guidelines

Existing commits follow Conventional Commits, such as `feat: add pagination schema`. Use a concise, imperative subject. Pull requests should explain changes, public API effects, potential breaking changes, relevant issues, and validation results. Keep changes focused and update `pnpm-lock.yaml` with dependency changes. When changing package exports or build configuration, verify public exports, generated declarations, and ESM/CommonJS compatibility before release.
