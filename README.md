# api-shapes

Lightweight, framework-agnostic API schemas and types powered by Zod.

## Installation

```sh
pnpm add api-shapes zod@^4.6.5
```

Zod is a required peer dependency provided by your application. The supported
version range is `^4.6.5`.

## Pagination requests

```ts
import type { PaginationQuery, PaginationQueryInput } from 'api-shapes'
import { paginationQuerySchema } from 'api-shapes'

const input: PaginationQueryInput = { page: '2', pageSize: '20' }
const query: PaginationQuery = paginationQuerySchema.parse(input)
// { page: 2, pageSize: 20 }

paginationQuerySchema.parse({})
// { page: 1, pageSize: 10 }
```

Both fields must resolve to integers. `page` starts at 1; `pageSize` ranges
from 1 to 100. Missing fields receive defaults. Conversion follows Zod's
`z.coerce.number()` behavior; invalid values produce a Zod validation error.
Use `.safeParse()` when you prefer a result instead of an exception.

The package exports `DEFAULT_PAGE`, `DEFAULT_PAGE_SIZE`, and `MAX_PAGE_SIZE`.

### Custom pagination options

```ts
import { createPaginationQuerySchema } from 'api-shapes'

const querySchema = createPaginationQuerySchema({
  defaultPage: 1,
  defaultPageSize: 20,
  maxPageSize: 200,
})

querySchema.parse({})
// { page: 1, pageSize: 20 }
querySchema.parse({ page: '2', pageSize: '200' })
// { page: 2, pageSize: 200 }
```

All options are optional and fall back to 1, 10, and 100 respectively. They
must be positive integers, with `defaultPageSize <= maxPageSize`; invalid
configuration throws a Zod error when the factory is called. Defaults are not
clamped: setting `maxPageSize` below 10 also requires a compatible
`defaultPageSize`. The minimum request page remains 1 regardless of its default.
Each factory call creates an independent Schema that can be extended with
`.extend()`. The package exports the `PaginationOptions` type.

## Pagination responses

```ts
import { paginatedResponseSchema } from 'api-shapes'
import { z } from 'zod'

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
})
const usersPageSchema = paginatedResponseSchema(userSchema)
type UsersPage = z.infer<typeof usersPageSchema>

const response: UsersPage = usersPageSchema.parse({
  items: [{ id: '1', name: 'Ada' }],
  page: 1,
  pageSize: 10,
  total: 1,
})
```

All four response fields are required. `page` is a positive integer,
`pageSize` is a positive integer with no configured maximum, and `total` is a nonnegative integer.
Response numbers are not coerced. Empty `items` are allowed; the schema does
not enforce relationships between the pagination fields and item count.

## Error responses

Only error responses use the shared `{ code, message }` structure. Define normal
responses to fit your API; no common response wrapper is required.

```ts
import type { ErrorResponse } from 'api-shapes'
import { errorSchema } from 'api-shapes'

const error: ErrorResponse = errorSchema.parse({
  code: 'NOT_FOUND',
  message: 'Resource not found',
})
```

Both fields are required strings and may be empty. Neither field is trimmed
or coerced. Use `.safeParse()` to
handle invalid data without throwing.

### Default error details

```ts
import { errorWithDetailsSchema } from 'api-shapes'
import { z } from 'zod'

type ErrorWithDetails = z.infer<typeof errorWithDetailsSchema>

const error: ErrorWithDetails = errorWithDetailsSchema.parse({
  code: 'VALIDATION_ERROR',
  message: 'Invalid input',
  details: [{ key: 'email', value: 'Invalid email format' }],
})
```

`details` is optional and may be an empty array. Each default detail has required
string fields `key` and `value`, which may be empty. The package also exports
`errorDetailSchema` and its inferred `ErrorDetail` type.

### Custom error details

```ts
import { createErrorSchema } from 'api-shapes'
import { z } from 'zod'

const customSchema = createErrorSchema(
  z.object({
    field: z.string(),
    reason: z.string(),
  }),
)
type CustomError = z.infer<typeof customSchema>

const error: CustomError = customSchema.parse({
  code: 'VALIDATION_ERROR',
  message: 'Invalid input',
  details: [{ field: 'email', reason: 'Invalid email format' }],
})
```

The factory extends `errorSchema` with an optional array of your detail
schema, preserving its validation and inferred types.
