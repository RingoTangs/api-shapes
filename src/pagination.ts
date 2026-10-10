import { z } from 'zod'

export const DEFAULT_PAGE = 1
export const DEFAULT_PAGE_SIZE = 10

// 配置中的默认值必须为正整数。
const paginationOptionsSchema = z.object({
  defaultPage: z.number().int().min(1).default(DEFAULT_PAGE),
  defaultPageSize: z.number().int().min(1).default(DEFAULT_PAGE_SIZE),
})

export type PaginationOptions = z.input<typeof paginationOptionsSchema>

// 创建分页请求 Schema，支持数字字符串转换；无效配置在创建时抛错。
export const createPaginationQuerySchema = (
  options: PaginationOptions = {},
) => {
  const { defaultPage, defaultPageSize } =
    paginationOptionsSchema.parse(options)

  return z.object({
    page: z.coerce.number().int().min(1).default(defaultPage),
    pageSize: z.coerce.number().int().min(1).default(defaultPageSize),
  })
}

export const paginationQuerySchema = createPaginationQuerySchema()

export type PaginationQuery = z.output<typeof paginationQuerySchema>
export type PaginationQueryInput = z.input<typeof paginationQuerySchema>

// 创建分页响应 Schema；数字不转换，页大小不设上限。
export const paginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    total: z.number().int().min(0),
    items: z.array(itemSchema),
  })
