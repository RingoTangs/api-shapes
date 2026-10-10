import { z } from 'zod'

export const DEFAULT_PAGE = 1
export const DEFAULT_PAGE_SIZE = 10
export const MAX_PAGE_SIZE = 100

// 默认值必须为正整数，默认页大小不得超过请求上限。
const pageOptionsSchema = z
  .object({
    defaultPage: z.number().int().min(1).default(DEFAULT_PAGE),
    defaultPageSize: z.number().int().min(1).default(DEFAULT_PAGE_SIZE),
    maxPageSize: z.number().int().min(1).default(MAX_PAGE_SIZE),
  })
  .refine((options) => options.defaultPageSize <= options.maxPageSize, {
    message: 'defaultPageSize must not exceed maxPageSize',
    path: ['defaultPageSize'],
  })

export type PageOptions = z.input<typeof pageOptionsSchema>

// 创建分页请求 Schema，支持数字字符串转换；无效配置在创建时抛错。
export const createPageQuerySchema = (options: PageOptions = {}) => {
  const { defaultPage, defaultPageSize, maxPageSize } =
    pageOptionsSchema.parse(options)

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

export const pageQuerySchema = createPageQuerySchema()

export type PageQuery = z.output<typeof pageQuerySchema>
export type PageQueryInput = z.input<typeof pageQuerySchema>

// 创建分页响应 Schema；数字不转换，页大小不设上限。
export const createPageSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    total: z.number().int().min(0),
    items: z.array(itemSchema),
  })
