import { z } from 'zod'

export const errorSchema = z.object({
  code: z.string(),
  message: z.string(),
})

export type ErrorResponse = z.infer<typeof errorSchema>

export const errorDetailSchema = z.object({
  key: z.string(),
  value: z.string(),
})

export type ErrorDetail = z.infer<typeof errorDetailSchema>

export const createErrorSchema = <T extends z.ZodType>(detailSchema: T) =>
  errorSchema.extend({
    details: z.array(detailSchema).optional(),
  })

export const errorWithDetailsSchema = createErrorSchema(errorDetailSchema)
