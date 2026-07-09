import { Elysia } from 'elysia'

import { errorResponse } from '../../plugins/error'
import { commonModelsPlugin } from '../../plugins/models'
import { userAuth } from '../../plugins/user-auth'
import { UserModel } from './model'
import { UserService } from './service'

export const user = new Elysia({ prefix: '/user' })
  .use(commonModelsPlugin)
  .model(UserModel.models)
  .use(userAuth)
  .get(
    '/current',
    async ({ userProfile, status }) => {
      const user = await UserService.findById(userProfile.userId)

      if (!user) {
        return status(404, errorResponse('NOT_FOUND', '该用户不存在'))
      }

      return user
    },
    {
      response: {
        200: 'UserResponse',
        401: 'ApiErrorResponse',
        404: 'ApiErrorResponse'
      },
      detail: {
        tags: ['User'],
        description: '读取当前登录用户的个人信息。',
        security: [
          {
            bearerAuth: []
          }
        ]
      }
    }
  )
  .post(
    '/changePassword',
    async ({ body, userProfile, status }) => {
      const result = await UserService.changePassword(userProfile.userId, body)

      if (result.err) {
        return status(
          result.err.status,
          errorResponse(result.err.code, result.err.message)
        )
      }

      return status(204, undefined)
    },
    {
      body: 'UserChangePasswordBody',
      response: {
        204: 'ApiNoContentResponse',
        400: 'ApiErrorResponse',
        401: 'ApiErrorResponse',
        404: 'ApiErrorResponse'
      },
      detail: {
        tags: ['User'],
        description: '校验旧密码后修改当前登录用户密码。',
        security: [
          {
            bearerAuth: []
          }
        ]
      }
    }
  )
  .post(
    '/update',
    async ({ body, userProfile, status }) => {
      const result = await UserService.update(userProfile.userId, body)

      if (result.err) {
        return status(
          result.err.status,
          errorResponse(result.err.code, result.err.message)
        )
      }

      return result.user
    },
    {
      body: 'UserUpdateBody',
      response: {
        200: 'UserResponse',
        400: 'ApiErrorResponse',
        401: 'ApiErrorResponse',
        404: 'ApiErrorResponse',
        409: 'ApiErrorResponse'
      },
      detail: {
        tags: ['User'],
        description: '修改当前登录用户资料，不能修改 id、updatedAt 和 password。',
        security: [
          {
            bearerAuth: []
          }
        ]
      }
    }
  )
