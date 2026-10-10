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
`pageSize` is an integer from 1 to 100, and `total` is a nonnegative integer.
Response numbers are not coerced. Empty `items` are allowed; the schema does
not enforce relationships between the pagination fields and item count.

## Error responses

Only error responses use the shared `{ code, message }` structure. Define normal
responses to fit your API; no common response wrapper is required.

```ts
import type { ErrorResponse } from 'api-shapes'
import { errorResponseSchema } from 'api-shapes'

const error: ErrorResponse = errorResponseSchema.parse({
  code: 'NOT_FOUND',
  message: 'Resource not found',
})
```

Both fields are required strings. `code` must contain at least one character;
it is not trimmed or coerced. `message` may be empty. Use `.safeParse()` to
handle invalid data without throwing.
