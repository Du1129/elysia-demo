import { Elysia } from 'elysia'

import { errorResponse } from '../../plugins/error'
import { commonModelsPlugin } from '../../plugins/models'
import { userJwtPlugin } from '../../plugins/user-auth'
import { UserModel } from '../user/model'
import { BaseModel } from './model'
import { BaseService } from './service'

export const base = new Elysia({ prefix: '/base' })
  .use(commonModelsPlugin)
  .model(BaseModel.models)
  .model(UserModel.models)
  .use(userJwtPlugin)
  .get(
    '/captcha',
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
        400: 'ApiErrorResponse',
        401: 'ApiErrorResponse',
        403: 'ApiErrorResponse'
      },
      detail: {
        tags: ['Base'],
        description: '使用手机号或邮箱、密码和验证码登录，成功后返回用户 JWT。'
      }
    }
  )
  .post(
    '/sms',
    async ({ body, status }) => {
      const result = await BaseService.sendSms(body)

      if (result.err) {
        return status(
          result.err.status,
          errorResponse(result.err.code, result.err.message)
        )
      }

      return status(204, undefined)
    },
    {
      body: 'BaseSmsBody',
      response: {
        204: 'ApiNoContentResponse',
        429: 'ApiErrorResponse',
        503: 'ApiErrorResponse'
      },
      detail: {
        tags: ['Base'],
        description: '发送邮箱验证码，同一邮箱同一场景一分钟内只能发送一次。'
      }
    }
  )
  .post(
    '/register',
    async ({ body, status }) => {
      const result = await BaseService.register(body)

      if (result.err) {
        return status(
          result.err.status,
          errorResponse(result.err.code, result.err.message)
        )
      }

      return status(201, result.user)
    },
    {
      body: 'BaseRegisterBody',
      response: {
        201: 'UserResponse',
        400: 'ApiErrorResponse',
        409: 'ApiErrorResponse'
      },
      detail: {
        tags: ['Base'],
        description: '使用手机号、邮箱、密码和邮箱验证码注册用户。'
      }
    }
  )
