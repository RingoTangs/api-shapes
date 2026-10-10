import { z } from 'zod'

// 业务扩展字段可通过 .extend() 声明。
export const errorSchema = z.object({
  code: z.string(),
  message: z.string(),
  type: z.string(),
  status: z.number().int().min(100).max(599),
  errors: z.array(z.any()),
})

export type ErrorResponse = z.infer<typeof errorSchema>
