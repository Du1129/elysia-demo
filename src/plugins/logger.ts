import { Elysia } from 'elysia'
import pino, { type LevelWithSilent } from 'pino'

import { formatDateTime } from '../utils/datetime'

const logLevels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const
const requestStartTimes = new WeakMap<Request, number>()

const isLogLevel = (value: string): value is LevelWithSilent =>
  logLevels.includes(value as (typeof logLevels)[number])

const getLogLevel = (): LevelWithSilent => {
  const level = Bun.env.LOG_LEVEL

  if (level && isLogLevel(level)) return level

  return Bun.env.NODE_ENV === 'production' ? 'info' : 'debug'
}

export const log = pino({
  level: getLogLevel(),
  timestamp: () => `,"time":"${formatDateTime()}"`,
  base: {
    service: 'elysia-demo'
  }
})

export const loggerPlugin = new Elysia({ name: 'logger-plugin' })
  .decorate('log', log)
  .onRequest(({ request }) => {
    requestStartTimes.set(request, performance.now())
  })
  .onAfterResponse(({ request, set }) => {
    const url = new URL(request.url)
    const startTime = requestStartTimes.get(request)
    const durationMs = startTime === undefined
      ? undefined
      : Math.round((performance.now() - startTime) * 100) / 100
    const statusCode = typeof set.status === 'number' ? set.status : 200
    const route = `${request.method} ${url.pathname}`
    const date = formatDateTime()

    log.info(
      {
        date,
        // route,
        // method: request.method,
        // path: url.pathname,
        // status: statusCode,
        // durationMs,
        request: {
          method: request.method,
          path: url.pathname
        },
        response: {
          statusCode,
          durationMs
        }
      },
      'request completed'
    )

    requestStartTimes.delete(request)
  })
  .as('scoped')
