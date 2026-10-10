# @ringotangs/api-shapes

[English](./README.md) | [简体中文](./README.zh-CN.md)

## Introduction

Lightweight, framework-agnostic API schemas and types powered by Zod.

- Parse pagination queries and validate paginated data.
- Define a shared error format with application-specific extensions.
- Infer TypeScript types directly from schemas.

Normal responses do not need a shared wrapper. Define your own business schemas
and extend the provided schemas where useful.

## Installation

```sh
npm install @ringotangs/api-shapes zod@^4.0.0
```

Or with pnpm:

```sh
pnpm add @ringotangs/api-shapes zod@^4.0.0
```

Zod 4 is a required peer dependency. The current supported range is `^4.0.0`.
The package provides ESM, CommonJS, and TypeScript declarations.

## Quick Start

```ts
import {
  createPageSchema,
  errorSchema,
  pageQuerySchema,
} from '@ringotangs/api-shapes'
import { z } from 'zod'

const query = pageQuerySchema.parse({ page: '2', pageSize: '20' })
// { page: 2, pageSize: 20 }

const usersPageSchema = createPageSchema(z.object({ id: z.string() }))
const page = usersPageSchema.parse({
  items: [{ id: 'user-1' }],
  page: query.page,
  pageSize: query.pageSize,
  total: 25,
})

const error = errorSchema.parse({
  code: 'NOT_FOUND',
  message: 'Resource not found',
})
```

`.parse()` throws a Zod error for invalid data. Use `.safeParse()` when you
prefer a result with a `success` flag.

## Pagination

### Query defaults and types

`pageQuerySchema` defaults to `page: 1` and `pageSize: 10` for missing or
`undefined` fields. Both values must resolve to positive integers. Conversion
follows `z.coerce.number()`, including numeric strings. The default request page-size maximum is 100 (`MAX_PAGE_SIZE`).

```ts
import type { PageQuery, PageQueryInput } from '@ringotangs/api-shapes'
import { pageQuerySchema } from '@ringotangs/api-shapes'

const input: PageQueryInput = { page: '2' }
const query: PageQuery = pageQuerySchema.parse(input)
// { page: 2, pageSize: 10 }

const defaults = pageQuerySchema.parse({})
// { page: 1, pageSize: 10 }
```

`PageQueryInput` allows optional fields with unknown values before validation.
`PageQuery` contains required numeric fields after parsing.

### Custom defaults

```ts
import type { PageOptions } from '@ringotangs/api-shapes'
import { createPageQuerySchema } from '@ringotangs/api-shapes'

const options: PageOptions = {
  defaultPage: 1,
  defaultPageSize: 20,
  maxPageSize: 200,
}
const querySchema = createPageQuerySchema(options)

const query = querySchema.parse({})
// { page: 1, pageSize: 20 }
```

All three options are optional and must be positive integers. `maxPageSize`
defaults to 100 and can be overridden; `defaultPageSize` must not exceed it.
Defaults are not clamped. Invalid configuration
throws when the factory is called. Changing `defaultPage` does not change the
minimum page of 1. Each call creates an independent schema that supports
`.extend()` for additional query fields.

### Paginated responses

```ts
import { createPageSchema } from '@ringotangs/api-shapes'
import { z } from 'zod'

const userSchema = z.object({ id: z.string(), name: z.string() })
const usersPageSchema = createPageSchema(userSchema)
type UsersPage = z.infer<typeof usersPageSchema>

const page: UsersPage = usersPageSchema.parse({
  items: [{ id: 'user-1', name: 'Ada' }],
  page: 1,
  pageSize: 10,
  total: 1,
})
```

All four fields are required. `page` and `pageSize` are positive integers;
`total` is a nonnegative integer. Response numbers are not coerced or defaulted.
Empty `items` are valid. The schema does not compare item count with pagination
metadata. The supplied item schema determines item validation and inferred types.

## Error Response

`errorSchema` requires `code` and `message` as strings. Empty strings are allowed;
values are not trimmed or coerced. `ErrorResponse` is the inferred base type.

```ts
import type { ErrorResponse } from '@ringotangs/api-shapes'
import { errorSchema } from '@ringotangs/api-shapes'

const error: ErrorResponse = errorSchema.parse({
  code: 'VALIDATION_ERROR',
  message: 'Invalid input',
})
```

Use `.extend()` to declare and validate business fields:

```ts
import { errorSchema } from '@ringotangs/api-shapes'
import { z } from 'zod'

const validationErrorSchema = errorSchema.extend({
  errors: z.array(z.object({ field: z.string(), reason: z.string() })),
  traceId: z.string().optional(),
})
type ValidationError = z.infer<typeof validationErrorSchema>

const error: ValidationError = validationErrorSchema.parse({
  code: 'VALIDATION_ERROR',
  message: 'Invalid input',
  errors: [{ field: 'email', reason: 'Invalid email format' }],
  traceId: 'trace-1',
})
```

Schemas remove undeclared fields during parsing. Declare fields through
`.extend()` when they should be retained. Business error shapes are chosen by
your application; the library does not prescribe an error array format.

## API Reference

All exports are available from `@ringotangs/api-shapes`.

| API                               | Kind     | Description                                                            |
| --------------------------------- | -------- | ---------------------------------------------------------------------- |
| `DEFAULT_PAGE`                    | Constant | Default query page: `1`.                                               |
| `DEFAULT_PAGE_SIZE`               | Constant | Default query page size: `10`.                                         |
| `MAX_PAGE_SIZE`                   | Constant | Default request page-size maximum: `100`.                              |
| `pageQuerySchema`                 | Schema   | Pagination query with default settings and number coercion.            |
| `createPageQuerySchema(options?)` | Factory  | Query schema with custom defaults and page-size maximum.               |
| `createPageSchema(itemSchema)`    | Factory  | Response schema with `items`, `page`, `pageSize`, and `total`.         |
| `errorSchema`                     | Schema   | Base error response with `code` and `message`.                         |
| `PageOptions`                     | Type     | Optional `defaultPage`, `defaultPageSize`, and `maxPageSize` settings. |
| `PageQueryInput`                  | Type     | Input type of the default pagination query schema.                     |
| `PageQuery`                       | Type     | Parsed output type of the default pagination query schema.             |
| `ErrorResponse`                   | Type     | Parsed output type of the base error schema.                           |

## Development & License

Use Node.js `22.23.2` and pnpm `10.24.0`, as specified in the repository.

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm build
```

| Command           | Purpose                                                 |
| ----------------- | ------------------------------------------------------- |
| `pnpm dev`        | Run a development build with tsdown.                    |
| `pnpm test`       | Run the Vitest suite once.                              |
| `pnpm check`      | Run lint, format checks, type checking, and tests.      |
| `pnpm format`     | Check formatting with Prettier.                         |
| `pnpm build`      | Build production ESM/CommonJS bundles and declarations. |
| `pnpm pack:check` | Preview package contents after building.                |

Licensed under the [MIT License](./LICENSE).
