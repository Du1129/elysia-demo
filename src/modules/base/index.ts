import { Elysia } from 'elysia'

import { errorResponse } from '../../plugins/error'
import { userJwtPlugin } from '../../plugins/user-auth'
import { BaseModel } from './model'
import { BaseService } from './service'

export const base = new Elysia({ name: 'base' })
  .model(BaseModel.models)
  .use(userJwtPlugin)
  .get(
    '/base/captcha',
    ({ query }) => BaseService.createCaptcha(query),
    {
      query: 'BaseCaptchaQuery',
      response: {
        200: 'BaseCaptchaResponse'
      },
      detail: {
        tags: ['Base']
      }
    }
  )
  .post(
    '/login',
    async ({ body, status, userJwt }) => {
      const result = await BaseService.validateLogin(body)

      if (!result.ok) {
        return status(
          result.status,
          errorResponse(result.code, result.message)
        )
      }

      return {
        token: await userJwt.sign({
          sub: String(result.user.id),
          name: result.user.name
        })
      }
    },
    {
      body: 'BaseLoginBody',
      response: {
        200: 'BaseLoginResponse',
        400: 'BaseErrorResponse',
        401: 'BaseErrorResponse',
        403: 'BaseErrorResponse'
      },
      detail: {
        tags: ['Base']
      }
    }
  )
