import { z } from 'zod'

// 业务扩展字段可通过 .extend() 声明。
export const errorSchema = z.object({
  code: z.string(),
  message: z.string(),
})

export type ErrorResponse = z.infer<typeof errorSchema>
