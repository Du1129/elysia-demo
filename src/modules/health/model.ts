import { t } from 'elysia'

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

  export const mailResponse = t.Object({
    status: t.Literal('ok'),
    latencyMs: t.Number(),
    host: t.String(),
    port: t.Number(),
    user: t.String()
  })

  export const models = {
    HealthCheckResponse: checkResponse,
    HealthDatabaseResponse: databaseResponse,
    HealthRedisResponse: redisResponse,
    HealthMailResponse: mailResponse
  } as const
}
