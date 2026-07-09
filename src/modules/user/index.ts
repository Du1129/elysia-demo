import { Elysia } from 'elysia'

import { errorResponse } from '../../plugins/error'
import { commonModelsPlugin } from '../../plugins/models'
import { userAuth } from '../../plugins/user-auth'
import { UserModel } from './model'
import { UserService } from './service'

export const user = new Elysia({ prefix: '/users' })
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
        tags: ['Users'],
        description: '读取当前登录用户的个人信息。',
        security: [
          {
            bearerAuth: []
          }
        ]
      }
    }
  )
