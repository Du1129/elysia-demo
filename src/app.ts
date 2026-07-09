import { openapi } from '@elysia/openapi'
import { Elysia } from 'elysia'

import { modules } from './modules'
import { corsPlugin } from './plugins/cors'
import { errorHandler } from './plugins/error'
import { loggerPlugin } from './plugins/logger'
import { queuePlugin } from './plugins/queue'
import { schedulerPlugin } from './plugins/scheduler'

export const app = new Elysia()
  .use(loggerPlugin)
  .use(corsPlugin)
  .use(queuePlugin)
  .use(schedulerPlugin)
  .use(errorHandler)
  .use(
    openapi({
      path: '/openapi',
      documentation: {
        info: {
          title: 'Elysia Demo API',
          version: '0.1.0'
        },
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT'
            }
          }
        },
        tags: [
          {
            name: 'App',
            description: 'General endpoints'
          },
          {
            name: 'Health',
            description: 'Health check endpoints'
          },
          {
            name: 'Base',
            description: 'Login, captcha, sms and register endpoints'
          },
          {
            name: 'User',
            description: 'User endpoints'
          }
        ]
      }
    })
  )
  .get(
    '/',
    () => ({
      message: 'Hello Elysia'
    }),
    {
      detail: {
        tags: ['App']
      }
    }
  )
  .use(modules)

export type App = typeof app
