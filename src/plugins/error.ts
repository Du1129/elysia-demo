import { Elysia, t } from 'elysia'

import type { ErrorCode } from '../model'

const isProduction = Bun.env.NODE_ENV === 'production'

export namespace ErrorModel {
  export const errorResponse = t.Object({
    code: t.String(),
    message: t.String(),
    detail: t.Optional(t.Unknown())
  })

  export const models = {
    ApiErrorResponse: errorResponse
  } as const
}

export const errorResponse = (
  code: ErrorCode,
  message: string,
  detail?: unknown
) => ({
  code,
  message,
  ...(isProduction || detail === undefined ? {} : { detail })
})

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message

  return fallback
}

export const errorHandler = new Elysia({ name: 'error-handler' }).onError(
  { as: 'global' },
  ({ code, error, set }) => {
    switch (code) {
      case 'VALIDATION':
        set.status = 422

        return errorResponse('VALIDATION_ERROR', '参数格式不正确', {
          on: error.type,
          errors: error.all.map((item) => ({
            path: item.path,
            message: item.message,
            summary: item.summary
          }))
        })

      case 'NOT_FOUND':
        set.status = 404

        return errorResponse('NOT_FOUND', '接口不存在')

      case 'PARSE':
        set.status = 400

        return errorResponse('BAD_REQUEST', '请求参数不正确')

      case 'INVALID_COOKIE_SIGNATURE':
        set.status = 400

        return errorResponse('BAD_REQUEST', '无效的Cookie')

      case 'INTERNAL_SERVER_ERROR':
      case 'UNKNOWN':
      default:
        set.status = 500
        console.error(error)

        return errorResponse(
          'INTERNAL_SERVER_ERROR',
          isProduction
            ? '服务器异常'
            : getErrorMessage(error, '服务器异常')
        )
    }
  }
)
