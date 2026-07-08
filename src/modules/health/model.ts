import { t } from 'elysia'

import { ErrorModel } from '../../plugins/error'

export namespace HealthModel {
  export const checkResponse = t.Object({
    status: t.Literal('ok'),
    uptime: t.Number()
  })

  export const databaseResponse = t.Object({
    status: t.Union([t.Literal('ok'), t.Literal('error')]),
    latencyMs: t.Number(),
    database: t.String(),
    host: t.String(),
    port: t.Number()
  })

  export const redisResponse = t.Object({
    status: t.Literal('ok'),
    latencyMs: t.Number(),
    host: t.String(),
    port: t.Number()
  })

  export const databaseErrorResponse = ErrorModel.errorResponse

  export const models = {
    HealthCheckResponse: checkResponse,
    HealthDatabaseResponse: databaseResponse,
    HealthRedisResponse: redisResponse,
    HealthErrorResponse: databaseErrorResponse
  } as const
}
