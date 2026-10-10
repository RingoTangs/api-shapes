import type { ErrorResponse } from './index'
import { describe, expect, expectTypeOf, it } from 'vitest'
import { z } from 'zod'

import { errorSchema } from './index'

const response = {
  code: 'VALIDATION_ERROR',
  message: 'Invalid input',
}

describe('errorSchema', () => {
  it('accepts a complete error response', () => {
    expect(errorSchema.parse(response)).toEqual(response)
  })

  it('allows empty strings', () => {
    const input = { code: '', message: '' }
    expect(errorSchema.parse(input)).toEqual(input)
  })

  it.each(['code', 'message'] as const)('requires %s', (field) => {
    const input: Record<string, unknown> = { ...response }
    delete input[field]
    expect(errorSchema.safeParse(input).success).toBe(false)
    expect(
      errorSchema.safeParse({ ...response, [field]: undefined }).success,
    ).toBe(false)
  })

  describe.each(['code', 'message'] as const)('%s', (field) => {
    it.each([42, true, null, [], {}])(
      'rejects non-string value %j',
      (value) => {
        expect(
          errorSchema.safeParse({ ...response, [field]: value }).success,
        ).toBe(false)
      },
    )
  })

  it('removes undeclared fields', () => {
    expect(
      errorSchema.parse({
        ...response,
        type: 'validation',
        status: 422,
        errors: [],
        traceId: 'trace-1',
      }),
    ).toEqual(response)
  })

  it('infers required string fields', () => {
    expectTypeOf<ErrorResponse>().toEqualTypeOf<{
      code: string
      message: string
    }>()
    expectTypeOf(errorSchema.parse(response)).toEqualTypeOf<ErrorResponse>()
  })
})

describe('errorSchema extensions', () => {
  it('validates custom errors and declared business fields', () => {
    const schema = errorSchema.extend({
      errors: z.array(z.object({ field: z.string(), reason: z.string() })),
      traceId: z.string().optional(),
    })
    const input = {
      ...response,
      errors: [{ field: 'email', reason: 'Invalid email' }],
      traceId: 'trace-1',
    }
    expect(schema.parse(input)).toEqual(input)
    for (const errors of [
      null,
      {},
      'invalid',
      [{}],
      [{ field: 'email' }],
      [{ field: 'email', reason: 1 }],
    ]) {
      expect(schema.safeParse({ ...response, errors }).success).toBe(false)
    }
    expectTypeOf<z.infer<typeof schema>>().toEqualTypeOf<{
      code: string
      message: string
      errors: { field: string; reason: string }[]
      traceId?: string | undefined
    }>()
  })

  it('preserves transformed errors input and output types', () => {
    const schema = errorSchema.extend({
      errors: z.array(z.string().transform((value) => value.length)),
    })
    expectTypeOf<z.input<typeof schema>>().toEqualTypeOf<{
      code: string
      message: string
      errors: string[]
    }>()
    expectTypeOf<z.output<typeof schema>>().toEqualTypeOf<{
      code: string
      message: string
      errors: number[]
    }>()
    expect(schema.parse({ ...response, errors: ['email'] }).errors).toEqual([5])
  })
})
