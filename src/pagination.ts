import { z } from 'zod'

export const DEFAULT_PAGE = 1
export const DEFAULT_PAGE_SIZE = 10

// 配置必须为正整数；设置上限时，默认页大小不能超过上限。
const paginationOptionsSchema = z
  .object({
    defaultPage: z.number().int().min(1).default(DEFAULT_PAGE),
    defaultPageSize: z.number().int().min(1).default(DEFAULT_PAGE_SIZE),
    maxPageSize: z.number().int().min(1).optional(),
  })
  .refine(
    (options) =>
      options.maxPageSize === undefined ||
      options.defaultPageSize <= options.maxPageSize,
    {
      message: 'defaultPageSize must not exceed maxPageSize',
      path: ['defaultPageSize'],
    },
  )

export type PaginationOptions = z.input<typeof paginationOptionsSchema>

// 创建分页请求 Schema，支持数字字符串转换；无效配置在创建时抛错。
export const createPaginationQuerySchema = (
  options: PaginationOptions = {},
) => {
  const { defaultPage, defaultPageSize, maxPageSize } =
    paginationOptionsSchema.parse(options)

  let pageSizeSchema = z.coerce.number().int().min(1)
  if (maxPageSize !== undefined) {
    pageSizeSchema = pageSizeSchema.max(maxPageSize)
  }

  return z.object({
    page: z.coerce.number().int().min(1).default(defaultPage),
    pageSize: pageSizeSchema.default(defaultPageSize),
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
