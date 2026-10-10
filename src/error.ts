import { z } from 'zod'

export const errorResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
})

export type ErrorResponse = z.infer<typeof errorResponseSchema>

export const errorDetailSchema = z.object({
  key: z.string(),
  value: z.string(),
})

export type ErrorDetail = z.infer<typeof errorDetailSchema>

export const errorResponseWithDetailsSchema = <T extends z.ZodType>(
  detailSchema: T,
) =>
  errorResponseSchema.extend({
    details: z.array(detailSchema).optional(),
  })

export const errorWithDetailsSchema =
  errorResponseWithDetailsSchema(errorDetailSchema)
