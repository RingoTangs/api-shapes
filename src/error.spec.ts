import type { ErrorResponse } from './index'
import { describe, expect, expectTypeOf, it } from 'vitest'

import { z } from 'zod'

import { errorSchema } from './index'

describe('errorSchema', () => {
  it('accepts an error response', () => {
    const response = { code: 'NOT_FOUND', message: 'Resource not found' }
    expect(errorSchema.parse(response)).toEqual(response)
  })

  it('accepts a single-character code and an empty message', () => {
    expect(errorSchema.parse({ code: 'E', message: '' })).toEqual({
      code: 'E',
      message: '',
    })
  })

  it('accepts an empty code', () => {
    expect(errorSchema.safeParse({ code: '', message: 'Error' }).success).toBe(
      true,
    )
  })

  it.each([{}, { code: 'ERROR' }, { message: 'Error' }])(
    'rejects missing fields %j',
    (response) => {
      expect(errorSchema.safeParse(response).success).toBe(false)
    },
  )

  describe.each(['code', 'message'] as const)('%s', (field) => {
    it.each([42, true, null, undefined, [], {}])(
      'rejects non-string value %j',
      (value) => {
        expect(
          errorSchema.safeParse({
            code: 'ERROR',
            message: 'Error',
            [field]: value,
          }).success,
        ).toBe(false)
      },
    )
  })

  it('infers required string fields', () => {
    expectTypeOf<ErrorResponse>().toEqualTypeOf<{
      [key: string]: unknown
      code: string
      message: string
    }>()
    expectTypeOf(
      errorSchema.parse({ code: 'ERROR', message: 'Error' }),
    ).toEqualTypeOf<ErrorResponse>()
  })
})

describe('errorSchema extensions', () => {
  it('preserves undeclared business fields', () => {
    const response = {
      code: 'ERROR',
      message: 'Error',
      retryable: true,
      retryAfter: 30,
      traceId: 'trace-1',
      context: { operation: 'save' },
      details: [{ field: 'email', reason: 'Invalid email' }],
    }
    expect(errorSchema.parse(response)).toEqual(response)
  })

  it('validates and infers declared optional details', () => {
    const schema = errorSchema.extend({
      details: z
        .array(z.object({ field: z.string(), reason: z.string() }))
        .optional(),
    })
    const base = { code: 'VALIDATION_ERROR', message: 'Invalid input' }
    const details = [{ field: 'email', reason: 'Invalid email' }]
    expect(schema.parse(base)).toEqual(base)
    expect(schema.parse({ ...base, details })).toEqual({ ...base, details })
    expect(schema.parse({ ...base, details: [], traceId: 'trace-1' })).toEqual({
      ...base,
      details: [],
      traceId: 'trace-1',
    })
    for (const invalid of [
      null,
      {},
      'invalid',
      [{}],
      [{ field: 'email' }],
      [{ field: 'email', reason: 1 }],
    ]) {
      expect(schema.safeParse({ ...base, details: invalid }).success).toBe(
        false,
      )
    }
    expectTypeOf<z.infer<typeof schema>>().toEqualTypeOf<{
      [key: string]: unknown
      code: string
      message: string
      details?: { field: string; reason: string }[] | undefined
    }>()
  })

  it('preserves transformed extension input and output types', () => {
    const schema = errorSchema.extend({
      details: z
        .array(z.string().transform((value) => value.length))
        .optional(),
    })
    expectTypeOf<z.input<typeof schema>>().toEqualTypeOf<{
      [key: string]: unknown
      code: string
      message: string
      details?: string[] | undefined
    }>()
    expectTypeOf<z.output<typeof schema>>().toEqualTypeOf<{
      [key: string]: unknown
      code: string
      message: string
      details?: number[] | undefined
    }>()
    expect(
      schema.parse({ code: 'E', message: '', details: ['email'] }).details,
    ).toEqual([5])
  })
})
