import { openapi } from '@elysia/openapi'
import { Elysia } from 'elysia'

import { health } from './modules/health'
import { user } from './modules/user'
import { errorHandler } from './plugins/error'

export const app = new Elysia()
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
            name: 'Users',
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
  .use(health)
  .use(user)

export type App = typeof app
