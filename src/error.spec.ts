import type { ErrorDetail, ErrorResponse } from './index'
import { describe, expect, expectTypeOf, it } from 'vitest'

import { z } from 'zod'

import {
  errorDetailSchema,
  errorResponseSchema,
  errorResponseWithDetailsSchema,
  errorWithDetailsSchema,
} from './index'

describe('errorResponseSchema', () => {
  it('accepts an error response', () => {
    const response = { code: 'NOT_FOUND', message: 'Resource not found' }
    expect(errorResponseSchema.parse(response)).toEqual(response)
  })

  it('accepts a single-character code and an empty message', () => {
    expect(errorResponseSchema.parse({ code: 'E', message: '' })).toEqual({
      code: 'E',
      message: '',
    })
  })

  it('accepts an empty code', () => {
    expect(
      errorResponseSchema.safeParse({ code: '', message: 'Error' }).success,
    ).toBe(true)
  })

  it.each([{}, { code: 'ERROR' }, { message: 'Error' }])(
    'rejects missing fields %j',
    (response) => {
      expect(errorResponseSchema.safeParse(response).success).toBe(false)
    },
  )

  describe.each(['code', 'message'] as const)('%s', (field) => {
    it.each([42, true, null, undefined, [], {}])(
      'rejects non-string value %j',
      (value) => {
        expect(
          errorResponseSchema.safeParse({
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
      code: string
      message: string
    }>()
    expectTypeOf(
      errorResponseSchema.parse({ code: 'ERROR', message: 'Error' }),
    ).toEqualTypeOf<ErrorResponse>()
  })
})

describe('errorWithDetailsSchema', () => {
  const base = { code: 'VALIDATION_ERROR', message: 'Invalid input' }

  it('accepts omitted, undefined, or empty details', () => {
    expect(errorWithDetailsSchema.parse(base)).toEqual(base)
    expect(
      errorWithDetailsSchema.parse({ ...base, details: undefined }),
    ).toEqual({
      ...base,
      details: undefined,
    })
    expect(errorWithDetailsSchema.parse({ ...base, details: [] })).toEqual({
      ...base,
      details: [],
    })
  })

  it('validates default details including empty strings', () => {
    const details = [
      { key: 'email', value: 'Invalid email' },
      { key: '', value: '' },
    ]
    expect(errorWithDetailsSchema.parse({ ...base, details })).toEqual({
      ...base,
      details,
    })
    expect(errorDetailSchema.parse(details[0])).toEqual(details[0])
  })

  it('preserves base field validation', () => {
    expect(errorWithDetailsSchema.parse({ code: '', message: '' })).toEqual({
      code: '',
      message: '',
    })
    for (const invalid of [
      {},
      { code: 'E' },
      { message: 'Error' },
      { code: 1, message: 'Error' },
      { code: 'E', message: null },
    ]) {
      expect(errorWithDetailsSchema.safeParse(invalid).success).toBe(false)
    }
  })

  it.each([
    null,
    'invalid',
    {},
    1,
    true,
    [null],
    ['invalid'],
    [{}],
    [{ key: 'email' }],
    [{ value: 'Error' }],
    [{ key: 1, value: 'Error' }],
    [{ key: 'email', value: false }],
    [{ key: 'email', value: 'Error' }, { key: 'name' }],
  ])('rejects invalid details %j', (details) => {
    expect(errorWithDetailsSchema.safeParse({ ...base, details }).success).toBe(
      false,
    )
  })

  it('infers default detail and response types', () => {
    expectTypeOf<ErrorDetail>().toEqualTypeOf<{ key: string; value: string }>()
    expectTypeOf<z.infer<typeof errorWithDetailsSchema>>().toEqualTypeOf<{
      code: string
      message: string
      details?: ErrorDetail[] | undefined
    }>()
  })
})

describe('errorResponseWithDetailsSchema', () => {
  it('validates and infers custom details', () => {
    const schema = errorResponseWithDetailsSchema(
      z.object({ field: z.string(), reason: z.string() }),
    )
    const response = {
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
      details: [{ field: 'email', reason: 'Invalid email' }],
    }
    expect(schema.parse(response)).toEqual(response)
    expect(
      schema.safeParse({ ...response, details: [{ field: 'email' }] }).success,
    ).toBe(false)
    expect(
      schema.safeParse({
        ...response,
        details: [{ field: 'email', reason: 1 }],
      }).success,
    ).toBe(false)
    expectTypeOf<z.infer<typeof schema>>().toEqualTypeOf<{
      code: string
      message: string
      details?: { field: string; reason: string }[] | undefined
    }>()
  })

  it('preserves transformed detail input and output types', () => {
    const schema = errorResponseWithDetailsSchema(
      z.string().transform((value) => value.length),
    )
    expectTypeOf<z.input<typeof schema>>().toEqualTypeOf<{
      code: string
      message: string
      details?: string[] | undefined
    }>()
    expectTypeOf<z.output<typeof schema>>().toEqualTypeOf<{
      code: string
      message: string
      details?: number[] | undefined
    }>()
    expect(
      schema.parse({ code: 'E', message: '', details: ['email'] }).details,
    ).toEqual([5])
  })
})
