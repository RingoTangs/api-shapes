import type { PageOptions, PageQuery, PageQueryInput } from './index'
import { describe, expect, expectTypeOf, it } from 'vitest'

import { z } from 'zod'
import {
  createPageQuerySchema,
  createPageSchema,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  pageQuerySchema,
} from './index'

describe('pageQuerySchema', () => {
  it('uses exported defaults for missing fields', () => {
    expect(pageQuerySchema.parse({})).toEqual({
      page: DEFAULT_PAGE,
      pageSize: DEFAULT_PAGE_SIZE,
    })
    expect(pageQuerySchema.parse({ page: 2 })).toEqual({
      page: 2,
      pageSize: 10,
    })
    expect(pageQuerySchema.parse({ pageSize: 20 })).toEqual({
      page: 1,
      pageSize: 20,
    })
  })

  it('converts numeric strings', () => {
    expect(pageQuerySchema.parse({ page: '2', pageSize: '20' })).toEqual({
      page: 2,
      pageSize: 20,
    })
  })

  it('accepts inclusive page-size boundaries', () => {
    expect(pageQuerySchema.parse({ page: 1, pageSize: 1 })).toEqual({
      page: 1,
      pageSize: 1,
    })
    expect(pageQuerySchema.parse({ page: 101, pageSize: '100' })).toEqual({
      page: 101,
      pageSize: 100,
    })
  })

  it.each([0, -1, 1.5, 'invalid', '', null, Number.NaN, Infinity, -Infinity])(
    'rejects invalid page %s',
    (page) => {
      expect(pageQuerySchema.safeParse({ page }).success).toBe(false)
    },
  )

  it.each([0, -1, 1.5, 'invalid', '', null, Number.NaN, Infinity, -Infinity])(
    'rejects invalid pageSize %s',
    (pageSize) => {
      expect(pageQuerySchema.safeParse({ pageSize }).success).toBe(false)
    },
  )

  it('infers optional input fields and required numeric output', () => {
    expectTypeOf<PageQueryInput>().toEqualTypeOf<{
      page?: unknown
      pageSize?: unknown
    }>()
    expectTypeOf<PageQuery>().toEqualTypeOf<{
      page: number
      pageSize: number
    }>()
    expectTypeOf(pageQuerySchema.parse({})).toEqualTypeOf<PageQuery>()
  })
})

describe('createPageQuerySchema', () => {
  it('preserves defaults with omitted or empty options', () => {
    for (const schema of [
      createPageQuerySchema(),
      createPageQuerySchema({}),
      createPageQuerySchema({
        defaultPage: undefined,
        defaultPageSize: undefined,
      }),
    ]) {
      expect(schema.parse({})).toEqual({ page: 1, pageSize: 10 })
      expect(schema.safeParse({ pageSize: 101 }).success).toBe(false)
      expect(schema.parse({ pageSize: '100' }).pageSize).toBe(MAX_PAGE_SIZE)
    }
  })

  it('uses custom defaults within the default page-size limit', () => {
    const schema = createPageQuerySchema({
      defaultPage: 3,
      defaultPageSize: 20,
    })
    expect(schema.parse({})).toEqual({ page: 3, pageSize: 20 })
    expect(schema.parse({ page: '1', pageSize: '100' })).toEqual({
      page: 1,
      pageSize: 100,
    })
    expect(schema.parse({ pageSize: 1 }).pageSize).toBe(1)
    expect(schema.safeParse({ pageSize: 101 }).success).toBe(false)
  })

  it('fills omitted options and keeps instances independent', () => {
    expect(createPageQuerySchema({ defaultPage: 2 }).parse({})).toEqual({
      page: 2,
      pageSize: 10,
    })
    expect(createPageQuerySchema({ defaultPageSize: 100 }).parse({})).toEqual({
      page: 1,
      pageSize: 100,
    })
    expect(createPageQuerySchema().parse({ pageSize: 100 }).pageSize).toBe(
      MAX_PAGE_SIZE,
    )
    const small = createPageQuerySchema({
      defaultPageSize: 5,
    })
    const large = createPageQuerySchema({
      defaultPageSize: 100,
    })
    expect(small.parse({})).toEqual({ page: 1, pageSize: 5 })
    expect(small.parse({ pageSize: 100 }).pageSize).toBe(MAX_PAGE_SIZE)
    expect(large.parse({})).toEqual({ page: 1, pageSize: 100 })
    expect(pageQuerySchema.parse({})).toEqual({ page: 1, pageSize: 10 })
  })

  describe.each(['defaultPage', 'defaultPageSize', 'maxPageSize'] as const)(
    '%s',
    (field) => {
      it.each([0, -1, 1.5, Number.NaN, Infinity, -Infinity])(
        'rejects invalid configuration %s immediately',
        (value) => {
          expect(() => createPageQuerySchema({ [field]: value })).toThrow(
            z.ZodError,
          )
        },
      )
    },
  )

  it.each([101, '101'])(
    'rejects requests above the default maximum %s',
    (pageSize) => {
      expect(pageQuerySchema.safeParse({ pageSize }).success).toBe(false)
      expect(createPageQuerySchema().safeParse({ pageSize }).success).toBe(
        false,
      )
    },
  )

  it('validates the default page-size maximum at creation', () => {
    expect(MAX_PAGE_SIZE).toBe(100)
    expect(
      createPageQuerySchema({ defaultPageSize: MAX_PAGE_SIZE }).parse({})
        .pageSize,
    ).toBe(100)
    expect(() => createPageQuerySchema({ defaultPageSize: 101 })).toThrow(
      z.ZodError,
    )
  })

  it('supports larger custom defaults and an inclusive maximum', () => {
    const schema = createPageQuerySchema({
      defaultPageSize: 150,
      maxPageSize: 200,
    })
    expect(schema.parse({})).toEqual({ page: 1, pageSize: 150 })
    expect(schema.parse({ pageSize: '200' }).pageSize).toBe(200)
    expect(schema.safeParse({ pageSize: 201 }).success).toBe(false)
    expect(pageQuerySchema.safeParse({ pageSize: 150 }).success).toBe(false)
  })

  it('supports smaller maxima without changing other instances', () => {
    const schema = createPageQuerySchema({ defaultPageSize: 5, maxPageSize: 5 })
    expect(schema.parse({})).toEqual({ page: 1, pageSize: 5 })
    expect(schema.parse({ pageSize: 1 }).pageSize).toBe(1)
    expect(schema.parse({ pageSize: '5' }).pageSize).toBe(5)
    expect(schema.safeParse({ pageSize: 6 }).success).toBe(false)
    expect(pageQuerySchema.parse({ pageSize: 100 }).pageSize).toBe(100)
    expect(
      createPageQuerySchema({ maxPageSize: undefined }).parse({ pageSize: 100 })
        .pageSize,
    ).toBe(100)
  })

  it('rejects defaults above the configured maximum without clamping', () => {
    for (const options of [
      { maxPageSize: 5 },
      { defaultPageSize: 20, maxPageSize: 10 },
    ]) {
      expect(() => createPageQuerySchema(options)).toThrow(z.ZodError)
    }
    try {
      createPageQuerySchema({ defaultPageSize: 20, maxPageSize: 10 })
    } catch (error) {
      expect(error).toBeInstanceOf(z.ZodError)
      if (error instanceof z.ZodError) {
        expect(error.issues[0]?.path).toEqual(['defaultPageSize'])
      }
    }
  })

  it('preserves input and output types and supports extension', () => {
    expectTypeOf<PageOptions>().toEqualTypeOf<{
      defaultPage?: number | undefined
      defaultPageSize?: number | undefined
      maxPageSize?: number | undefined
    }>()
    const schema = createPageQuerySchema()
    expectTypeOf<z.input<typeof schema>>().toEqualTypeOf<PageQueryInput>()
    expectTypeOf<z.output<typeof schema>>().toEqualTypeOf<PageQuery>()
    expect(
      schema.extend({ search: z.string() }).parse({ search: 'Ada' }),
    ).toEqual({ page: 1, pageSize: 10, search: 'Ada' })
  })
})

describe('createPageSchema', () => {
  const itemSchema = z.object({ id: z.string(), name: z.string() })
  const responseSchema = createPageSchema(itemSchema)
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
      responseSchema.safeParse({ ...response, pageSize: 101 }).success,
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

    const transformedSchema = createPageSchema(
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
