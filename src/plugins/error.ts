import { Elysia, t } from 'elysia'

type ErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'DATABASE_ERROR'
  | 'CACHE_ERROR'
  | 'INTERNAL_SERVER_ERROR'

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

        return errorResponse('VALIDATION_ERROR', 'Validation failed', {
          on: error.type,
          errors: error.all.map((item) => ({
            path: item.path,
            message: item.message,
            summary: item.summary
          }))
        })

      case 'NOT_FOUND':
        set.status = 404

        return errorResponse('NOT_FOUND', 'Route not found')

      case 'PARSE':
        set.status = 400

        return errorResponse('BAD_REQUEST', 'Invalid request body')

      case 'INVALID_COOKIE_SIGNATURE':
        set.status = 400

        return errorResponse('BAD_REQUEST', 'Invalid cookie signature')

      case 'INTERNAL_SERVER_ERROR':
      case 'UNKNOWN':
      default:
        set.status = 500
        console.error(error)

        return errorResponse(
          'INTERNAL_SERVER_ERROR',
          isProduction
            ? 'Internal server error'
            : getErrorMessage(error, 'Internal server error')
        )
    }
  }
)
