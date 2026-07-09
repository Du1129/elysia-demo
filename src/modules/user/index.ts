import { Elysia } from 'elysia'

import { errorResponse } from '../../plugins/error'
import { userAuth, userJwtPlugin } from '../../plugins/user-auth'
import { UserModel } from './model'
import { UserService } from './service'

const protectedUser = new Elysia()
  .model(UserModel.models)
  .use(userAuth)
  .get(
    '/me',
    ({ userProfile, status }) => {
      const user = UserService.findById(userProfile.userId)

      if (!user) {
        return status(404, errorResponse('NOT_FOUND', 'User not found'))
      }

      return {
        ...user,
        tokenUserId: userProfile.userId
      }
    },
    {
      response: {
        200: 'UserMeResponse',
        404: 'UserErrorResponse'
      },
      detail: {
        tags: ['Users'],
        description: '读取当前登录用户信息。',
        security: [
          {
            bearerAuth: []
          }
        ]
      }
    }
  )

const userToken = new Elysia()
  .model(UserModel.models)
  .use(userJwtPlugin)
  .post(
    '/token/:id',
    async ({ userJwt, params, status }) => {
      const user = UserService.findById(params.id)

      if (!user) {
        return status(404, errorResponse('NOT_FOUND', 'User not found'))
      }

      return {
        token: await userJwt.sign({
          userId: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          status: user.status
        })
      }
    },
    {
      params: UserModel.idParams,
      response: {
        200: 'UserTokenResponse',
        404: 'UserErrorResponse'
      },
      detail: {
        tags: ['Users'],
        description: '按用户 id 生成测试用 JWT。'
      }
    }
  )

export const user = new Elysia({ prefix: '/users' })
  .model(UserModel.models)
  .get(
    '/',
    () => UserService.list(),
    {
      response: {
        200: 'UserListResponse'
      },
      detail: {
        tags: ['Users'],
        description: '获取用户列表。'
      }
    }
  )
  .use(protectedUser)
  .use(userToken)
  .get(
    '/:id',
    ({ params, status }) => {
      const user = UserService.findById(params.id)

      if (!user) {
        return status(404, errorResponse('NOT_FOUND', 'User not found'))
      }

      return user
    },
    {
      params: UserModel.idParams,
      response: {
        200: 'UserResponse',
        404: 'UserErrorResponse'
      },
      detail: {
        tags: ['Users'],
        description: '按用户 id 获取用户详情。'
      }
    }
  )
  .post(
    '/',
    ({ body, status }) => status(201, UserService.create(body)),
    {
      body: UserModel.createBody,
      response: {
        201: 'UserResponse'
      },
      detail: {
        tags: ['Users'],
        description: '创建用户。'
      }
    }
  )
