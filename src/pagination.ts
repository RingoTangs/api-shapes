import { z } from 'zod'

export const DEFAULT_PAGE = 1
export const DEFAULT_PAGE_SIZE = 10
export const MAX_PAGE_SIZE = 100

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE),
})

export type PaginationQuery = z.output<typeof paginationQuerySchema>
export type PaginationQueryInput = z.input<typeof paginationQuerySchema>

export const paginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1).max(MAX_PAGE_SIZE),
    total: z.number().int().min(0),
    items: z.array(itemSchema),
  })
