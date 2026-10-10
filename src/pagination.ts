import { z } from 'zod'

export const DEFAULT_PAGE = 1
export const DEFAULT_PAGE_SIZE = 10
export const MAX_PAGE_SIZE = 100

const paginationOptionsSchema = z
  .object({
    defaultPage: z.number().int().min(1).default(DEFAULT_PAGE),
    defaultPageSize: z.number().int().min(1).default(DEFAULT_PAGE_SIZE),
    maxPageSize: z.number().int().min(1).default(MAX_PAGE_SIZE),
  })
  .refine((options) => options.defaultPageSize <= options.maxPageSize, {
    message: 'defaultPageSize must not exceed maxPageSize',
    path: ['defaultPageSize'],
  })

export type PaginationOptions = z.input<typeof paginationOptionsSchema>

export const createPaginationQuerySchema = (
  options: PaginationOptions = {},
) => {
  const { defaultPage, defaultPageSize, maxPageSize } =
    paginationOptionsSchema.parse(options)

  return z.object({
    page: z.coerce.number().int().min(1).default(defaultPage),
    pageSize: z.coerce
      .number()
      .int()
      .min(1)
      .max(maxPageSize)
      .default(defaultPageSize),
  })
}

export const paginationQuerySchema = createPaginationQuerySchema()

export type PaginationQuery = z.output<typeof paginationQuerySchema>
export type PaginationQueryInput = z.input<typeof paginationQuerySchema>

export const paginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    total: z.number().int().min(0),
    items: z.array(itemSchema),
  })
