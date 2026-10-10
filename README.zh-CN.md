# @ringotangs/api-shapes

[English](./README.md) | [简体中文](./README.zh-CN.md)

## 简介

基于 Zod 的轻量级 API Schema 与类型库，不依赖 Web 框架。

- 解析分页请求参数，校验分页响应数据。
- 定义统一的基础错误格式，支持业务字段扩展。
- 直接从 Schema 推导 TypeScript 类型。

正常响应无需统一包装。你可以自行定义业务 Schema，并按需扩展本库提供的 Schema。

## 安装

```sh
npm install @ringotangs/api-shapes zod@^4.0.0
```

或使用 pnpm：

```sh
pnpm add @ringotangs/api-shapes zod@^4.0.0
```

Zod 4 是必需的 peer dependency，当前支持的版本范围为 `^4.0.0`。
本库提供 ESM、CommonJS 和 TypeScript 类型声明。

## 快速开始

```ts
import {
  createPageSchema,
  errorSchema,
  pageQuerySchema,
} from '@ringotangs/api-shapes'
import { z } from 'zod'

const query = pageQuerySchema.parse({ page: '2', pageSize: '20' })
// { page: 2, pageSize: 20 }

const usersPageSchema = createPageSchema(z.object({ id: z.string() }))
const page = usersPageSchema.parse({
  items: [{ id: 'user-1' }],
  page: query.page,
  pageSize: query.pageSize,
  total: 25,
})

const error = errorSchema.parse({
  code: 'NOT_FOUND',
  message: '资源不存在',
})
```

数据无效时，`.parse()` 会抛出 Zod 错误。如果希望获取带有 `success` 标记的结果，
可以使用 `.safeParse()`。

## 分页

### 请求默认值与类型

当字段缺省或为 `undefined` 时，`pageQuerySchema` 使用 `page: 1` 和 `pageSize: 10`。
两个字段转换后都必须为正整数，转换遵循 `z.coerce.number()` 的行为，支持数字字符串。
默认请求页大小上限为 100（`MAX_PAGE_SIZE`）。

```ts
import type { PageQuery, PageQueryInput } from '@ringotangs/api-shapes'
import { pageQuerySchema } from '@ringotangs/api-shapes'

const input: PageQueryInput = { page: '2' }
const query: PageQuery = pageQuerySchema.parse(input)
// { page: 2, pageSize: 10 }

const defaults = pageQuerySchema.parse({})
// { page: 1, pageSize: 10 }
```

`PageQueryInput` 表示校验前的输入，字段可选且值为 `unknown`。
`PageQuery` 表示解析后的输出，包含必填的数字字段。

### 自定义默认值

```ts
import type { PageOptions } from '@ringotangs/api-shapes'
import { createPageQuerySchema } from '@ringotangs/api-shapes'

const options: PageOptions = {
  defaultPage: 1,
  defaultPageSize: 20,
  maxPageSize: 200,
}
const querySchema = createPageQuerySchema(options)

const query = querySchema.parse({})
// { page: 1, pageSize: 20 }
```

三个配置项均可选，提供时必须为正整数。`maxPageSize` 默认为 100，可自定义；
`defaultPageSize` 不得超过该上限，不会自动缩减默认值。无效配置会在调用工厂时抛错。
调整 `defaultPage` 不会改变页码最小值 1。每次调用都会创建独立的 Schema，
可通过 `.extend()` 添加业务查询字段。

### 分页响应

```ts
import { createPageSchema } from '@ringotangs/api-shapes'
import { z } from 'zod'

const userSchema = z.object({ id: z.string(), name: z.string() })
const usersPageSchema = createPageSchema(userSchema)
type UsersPage = z.infer<typeof usersPageSchema>

const page: UsersPage = usersPageSchema.parse({
  items: [{ id: 'user-1', name: 'Ada' }],
  page: 1,
  pageSize: 10,
  total: 1,
})
```

四个字段均必填。`page` 和 `pageSize` 为正整数，`total` 为非负整数。
响应数字不进行类型转换，也不补默认值。`items` 可以为空数组，Schema 不检查
数组长度与分页信息之间的关系。元素的校验规则与推导类型由传入的 Schema 决定。

## 错误响应

`errorSchema` 要求 `code` 和 `message` 为字符串，允许空字符串，不去除空白或转换类型。
`ErrorResponse` 是推导出的基础错误类型。

```ts
import type { ErrorResponse } from '@ringotangs/api-shapes'
import { errorSchema } from '@ringotangs/api-shapes'

const error: ErrorResponse = errorSchema.parse({
  code: 'VALIDATION_ERROR',
  message: '参数错误',
})
```

通过 `.extend()` 声明并校验业务字段：

```ts
import { errorSchema } from '@ringotangs/api-shapes'
import { z } from 'zod'

const validationErrorSchema = errorSchema.extend({
  errors: z.array(z.object({ field: z.string(), reason: z.string() })),
  traceId: z.string().optional(),
})
type ValidationError = z.infer<typeof validationErrorSchema>

const error: ValidationError = validationErrorSchema.parse({
  code: 'VALIDATION_ERROR',
  message: '参数错误',
  errors: [{ field: 'email', reason: '邮箱格式错误' }],
  traceId: 'trace-1',
})
```

Schema 会在解析时移除未声明的字段。需要保留业务字段时，应通过 `.extend()` 声明。
业务错误的结构由应用自行决定，本库不规定错误数组的格式。

## API 参考

所有公开 API 均从 `@ringotangs/api-shapes` 导入。

| API                               | 类别   | 说明                                                          |
| --------------------------------- | ------ | ------------------------------------------------------------- |
| `DEFAULT_PAGE`                    | 常量   | 默认请求页码：`1`。                                           |
| `DEFAULT_PAGE_SIZE`               | 常量   | 默认请求页大小：`10`。                                        |
| `MAX_PAGE_SIZE`                   | 常量   | 默认请求页大小上限：`100`。                                   |
| `pageQuerySchema`                 | Schema | 使用默认配置的分页请求 Schema，支持数字转换。                 |
| `createPageQuerySchema(options?)` | 工厂   | 使用自定义默认值和页大小上限创建请求 Schema。                 |
| `createPageSchema(itemSchema)`    | 工厂   | 创建包含 `items`、`page`、`pageSize`、`total` 的响应 Schema。 |
| `errorSchema`                     | Schema | 包含 `code` 和 `message` 的基础错误 Schema。                  |
| `PageOptions`                     | 类型   | 可选的 `defaultPage`、`defaultPageSize`、`maxPageSize` 配置。 |
| `PageQueryInput`                  | 类型   | 默认分页请求 Schema 的输入类型。                              |
| `PageQuery`                       | 类型   | 默认分页请求 Schema 的解析输出类型。                          |
| `ErrorResponse`                   | 类型   | 基础错误 Schema 的解析输出类型。                              |

## 开发与许可证

使用仓库指定的 Node.js `22.23.2` 和 pnpm `10.24.0`。

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm build
```

| 命令              | 用途                                   |
| ----------------- | -------------------------------------- |
| `pnpm dev`        | 使用 tsdown 执行开发构建。             |
| `pnpm test`       | 执行一次 Vitest 测试。                 |
| `pnpm check`      | 执行 lint、格式检查、类型检查和测试。  |
| `pnpm format`     | 使用 Prettier 检查格式。               |
| `pnpm build`      | 构建生产 ESM/CommonJS 产物和类型声明。 |
| `pnpm pack:check` | 构建后预览 npm 包内容。                |

本项目采用 [MIT 许可证](./LICENSE)。
