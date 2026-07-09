export type ErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'TOO_MANY_REQUESTS'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'DATABASE_ERROR'
  | 'CACHE_ERROR'
  | 'INTERNAL_SERVER_ERROR'

export type ServiceError<
  TStatus extends number = number,
  TCode extends ErrorCode = ErrorCode
> = {
  status: TStatus
  code: TCode
  message: string
}

export function serviceError<
  TStatus extends number,
  TCode extends ErrorCode
>(
  status: TStatus,
  code: TCode,
  message: string
): { err: ServiceError<TStatus, TCode> }

export function serviceError<
  TStatus extends number,
  TCode extends ErrorCode,
  TKey extends string
>(
  status: TStatus,
  code: TCode,
  message: string,
  key: TKey
): { err: ServiceError<TStatus, TCode> } & { [K in TKey]: null }

export function serviceError<
  TStatus extends number,
  TCode extends ErrorCode,
  TKey extends string
>(
  status: TStatus,
  code: TCode,
  message: string,
  key?: TKey
) {
  const result = {
    err: {
      status,
      code,
      message
    }
  }

  return key
    ? ({
        ...result,
        [key]: null
      } as { err: ServiceError<TStatus, TCode> } & { [K in TKey]: null })
    : result
}
