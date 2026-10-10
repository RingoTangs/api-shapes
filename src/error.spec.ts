import type { ErrorResponse } from './index'
import { describe, expect, expectTypeOf, it } from 'vitest'
import { z } from 'zod'

import { errorSchema } from './index'

const response = {
  code: 'VALIDATION_ERROR',
  message: 'Invalid input',
  type: 'validation',
  status: 422,
  errors: [],
}

describe('errorSchema', () => {
  it('accepts a complete error response', () => {
    expect(errorSchema.parse(response)).toEqual(response)
  })

  it('allows empty strings and an empty errors array', () => {
    const input = { ...response, code: '', message: '', type: '' }
    expect(errorSchema.parse(input)).toEqual(input)
  })

  it.each(['code', 'message', 'type', 'status', 'errors'] as const)(
    'requires %s',
    (field) => {
      const input: Record<string, unknown> = { ...response }
      delete input[field]
      expect(errorSchema.safeParse(input).success).toBe(false)
      expect(
        errorSchema.safeParse({ ...response, [field]: undefined }).success,
      ).toBe(false)
    },
  )

  describe.each(['code', 'message', 'type'] as const)('%s', (field) => {
    it.each([42, true, null, [], {}])(
      'rejects non-string value %j',
      (value) => {
        expect(
          errorSchema.safeParse({ ...response, [field]: value }).success,
        ).toBe(false)
      },
    )
  })

  it.each([100, 599])('accepts status boundary %s', (status) => {
    expect(errorSchema.parse({ ...response, status }).status).toBe(status)
  })

  it.each([
    99,
    600,
    -1,
    422.5,
    '422',
    null,
    true,
    {},
    [],
    Number.NaN,
    Infinity,
    -Infinity,
  ])('rejects invalid status %j', (status) => {
    expect(errorSchema.safeParse({ ...response, status }).success).toBe(false)
  })

  it('accepts arbitrary errors array elements', () => {
    const errors = [
      'Error',
      42,
      true,
      null,
      undefined,
      {},
      [],
      { field: 'email' },
    ]
    expect(errorSchema.parse({ ...response, errors }).errors).toEqual(errors)
  })

  it.each([null, 'Error', 42, true, {}])(
    'rejects non-array errors %j',
    (errors) => {
      expect(errorSchema.safeParse({ ...response, errors }).success).toBe(false)
    },
  )

  it('removes undeclared fields', () => {
    expect(errorSchema.parse({ ...response, traceId: 'trace-1' })).toEqual(
      response,
    )
  })

  it('infers required fields and any array elements', () => {
    expectTypeOf<ErrorResponse>().toEqualTypeOf<{
      code: string
      message: string
      type: string
      status: number
      errors: any[]
    }>()
    expectTypeOf(errorSchema.parse(response)).toEqualTypeOf<ErrorResponse>()
    expectTypeOf<ErrorResponse['errors'][number]>().toBeAny()
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
      type: string
      status: number
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
      type: string
      status: number
      errors: string[]
    }>()
    expectTypeOf<z.output<typeof schema>>().toEqualTypeOf<{
      code: string
      message: string
      type: string
      status: number
      errors: number[]
    }>()
    expect(schema.parse({ ...response, errors: ['email'] }).errors).toEqual([5])
  })
})
