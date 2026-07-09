import { Elysia } from 'elysia'

import { errorResponse } from '../../plugins/error'
import { commonModelsPlugin } from '../../plugins/models'
import { HealthModel } from './model'
import { HealthService } from './service'

export const health = new Elysia({ prefix: '/health' })
  .use(commonModelsPlugin)
  .model(HealthModel.models)
  .get(
    '/',
    () => HealthService.check(),
    {
      response: {
        200: 'HealthCheckResponse'
      },
      detail: {
        tags: ['Health'],
        description: '检查 API 进程是否存活。'
      }
    }
  )
  .get(
    '/db',
    async ({ status }) => {
      try {
        return await HealthService.checkDatabase()
      } catch (error) {
        const message =
          error instanceof Error && error.message
            ? error.message
            : 'Database connection failed'

        return status(503, {
          ...errorResponse('DATABASE_ERROR', message)
        })
      }
    },
    {
      response: {
        200: 'HealthDatabaseResponse',
        503: 'ApiErrorResponse'
      },
      detail: {
        tags: ['Health'],
        description: '检查 PostgreSQL 连接状态和延迟。'
      }
    }
  )
  .get(
    '/redis',
    async ({ status }) => {
      try {
        return await HealthService.checkRedis()
      } catch (error) {
        const message =
          error instanceof Error && error.message
            ? error.message
            : 'Redis connection failed'

        return status(503, errorResponse('CACHE_ERROR', message))
      }
    },
    {
      response: {
        200: 'HealthRedisResponse',
        503: 'ApiErrorResponse'
      },
      detail: {
        tags: ['Health'],
        description: '检查 Redis 连接状态和延迟。'
      }
    }
  )
  .get(
    '/mail',
    async ({ status }) => {
      try {
        return await HealthService.checkMail()
      } catch (error) {
        const message =
          error instanceof Error && error.message
            ? error.message
            : 'Mail connection failed'

        return status(503, errorResponse('INTERNAL_SERVER_ERROR', message))
      }
    },
    {
      response: {
        200: 'HealthMailResponse',
        503: 'ApiErrorResponse'
      },
      detail: {
        tags: ['Health'],
        description: '检查 SMTP 邮件服务配置和连接状态。'
      }
    }
  )
