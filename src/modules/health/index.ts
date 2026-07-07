import { Elysia } from 'elysia'

import { errorResponse } from '../../plugins/error'
import { HealthModel } from './model'
import { HealthService } from './service'

export const health = new Elysia({ prefix: '/health' })
  .model(HealthModel.models)
  .get(
    '/',
    () => HealthService.check(),
    {
      response: {
        200: 'HealthCheckResponse'
      },
      detail: {
        tags: ['Health']
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
        503: 'HealthErrorResponse'
      },
      detail: {
        tags: ['Health']
      }
    }
  )
