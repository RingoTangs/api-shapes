import type { ErrorResponse } from './index'
import { describe, expect, expectTypeOf, it } from 'vitest'

import { errorResponseSchema } from './index'

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
