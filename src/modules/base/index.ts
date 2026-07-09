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
        tags: ['Base'],
        description: '生成图形验证码，返回 captchaId、base64 图片数据和过期秒数。'
      }
    }
  )
  .post(
    '/login',
    async ({ body, status, userJwt }) => {
      const result = await BaseService.validateLogin(body)

      if (result.err) {
        return status(
          result.err.status,
          errorResponse(result.err.code, result.err.message)
        )
      }

      return {
        token: await userJwt.sign({
          userId: result.user.id,
          name: result.user.name,
          phone: result.user.phone,
          email: result.user.email,
          status: result.user.status
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
        tags: ['Base'],
        description: '使用手机号或邮箱、密码和验证码登录，成功后返回用户 JWT。'
      }
    }
  )
