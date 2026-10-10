import type { PaginationQuery, PaginationQueryInput } from './index'
import { describe, expect, expectTypeOf, it } from 'vitest'

import { z } from 'zod'
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  paginatedResponseSchema,
  paginationQuerySchema,
} from './index'

describe('paginationQuerySchema', () => {
  it('uses exported defaults for missing fields', () => {
    expect(paginationQuerySchema.parse({})).toEqual({
      page: DEFAULT_PAGE,
      pageSize: DEFAULT_PAGE_SIZE,
    })
    expect(paginationQuerySchema.parse({ page: 2 })).toEqual({
      page: 2,
      pageSize: 10,
    })
    expect(paginationQuerySchema.parse({ pageSize: 20 })).toEqual({
      page: 1,
      pageSize: 20,
    })
  })

  it('converts numeric strings', () => {
    expect(paginationQuerySchema.parse({ page: '2', pageSize: '20' })).toEqual({
      page: 2,
      pageSize: 20,
    })
  })

  it('accepts inclusive boundaries', () => {
    expect(paginationQuerySchema.parse({ page: 1, pageSize: 1 })).toEqual({
      page: 1,
      pageSize: 1,
    })
    expect(
      paginationQuerySchema.parse({ page: 101, pageSize: MAX_PAGE_SIZE }),
    ).toEqual({
      page: 101,
      pageSize: 100,
    })
  })

  it.each([0, -1, 1.5, 'invalid', '', null, Number.NaN, Infinity, -Infinity])(
    'rejects invalid page %s',
    (page) => {
      expect(paginationQuerySchema.safeParse({ page }).success).toBe(false)
    },
  )

  it.each([
    0,
    -1,
    1.5,
    101,
    '101',
    'invalid',
    '',
    null,
    Number.NaN,
    Infinity,
    -Infinity,
  ])('rejects invalid pageSize %s', (pageSize) => {
    expect(paginationQuerySchema.safeParse({ pageSize }).success).toBe(false)
  })

  it('infers optional input fields and required numeric output', () => {
    expectTypeOf<PaginationQueryInput>().toEqualTypeOf<{
      page?: unknown
      pageSize?: unknown
    }>()
    expectTypeOf<PaginationQuery>().toEqualTypeOf<{
      page: number
      pageSize: number
    }>()
    expectTypeOf(
      paginationQuerySchema.parse({}),
    ).toEqualTypeOf<PaginationQuery>()
  })
})

describe('paginatedResponseSchema', () => {
  const itemSchema = z.object({ id: z.string(), name: z.string() })
  const responseSchema = paginatedResponseSchema(itemSchema)
  const response = {
    items: [{ id: '1', name: 'Ada' }],
    page: 1,
    pageSize: 10,
    total: 1,
  }

  it('validates item data and pagination metadata', () => {
    expect(responseSchema.parse(response)).toEqual(response)
    expect(
      responseSchema.safeParse({ ...response, items: [{ id: 1, name: 'Ada' }] })
        .success,
    ).toBe(false)
    expect(
      responseSchema.safeParse({ ...response, items: [{ id: '1' }] }).success,
    ).toBe(false)
  })

  it('accepts empty results, out-of-range pages, and page-size boundaries', () => {
    expect(
      responseSchema.parse({ items: [], page: 20, pageSize: 1, total: 0 }),
    ).toEqual({
      items: [],
      page: 20,
      pageSize: 1,
      total: 0,
    })
    expect(
      responseSchema.safeParse({ ...response, pageSize: MAX_PAGE_SIZE })
        .success,
    ).toBe(true)
  })

  it.each(['items', 'page', 'pageSize', 'total'] as const)(
    'requires %s',
    (field) => {
      expect(
        responseSchema.safeParse({ ...response, [field]: undefined }).success,
      ).toBe(false)
    },
  )

  it.each([
    { page: 0 },
    { page: -1 },
    { page: 1.5 },
    { page: '1' },
    { page: Infinity },
    { pageSize: 0 },
    { pageSize: -1 },
    { pageSize: 1.5 },
    { pageSize: 101 },
    { pageSize: '10' },
    { total: -1 },
    { total: 1.5 },
    { total: '1' },
    { total: Number.NaN },
    { total: Infinity },
    { items: {} },
  ])('rejects invalid response fields %j', (fields) => {
    expect(responseSchema.safeParse({ ...response, ...fields }).success).toBe(
      false,
    )
  })

  it('preserves the supplied item schema output type', () => {
    type Response = z.infer<typeof responseSchema>
    expectTypeOf<Response>().toEqualTypeOf<{
      items: { id: string; name: string }[]
      page: number
      pageSize: number
      total: number
    }>()

    const transformedSchema = paginatedResponseSchema(
      z.string().transform((value) => value.length),
    )
    expectTypeOf<z.output<typeof transformedSchema>>().toEqualTypeOf<{
      items: number[]
      page: number
      pageSize: number
      total: number
    }>()
    expectTypeOf<z.input<typeof transformedSchema>>().toEqualTypeOf<{
      items: string[]
      page: number
      pageSize: number
      total: number
    }>()
    expect(
      transformedSchema.parse({ ...response, items: ['Ada'] }).items,
    ).toEqual([3])
  })
})
