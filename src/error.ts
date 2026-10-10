import { z } from 'zod'

// 保留业务扩展字段；需要校验时可使用 .extend() 声明。
export const errorSchema = z.looseObject({
  code: z.string(),
  message: z.string(),
})

export type ErrorResponse = z.infer<typeof errorSchema>
