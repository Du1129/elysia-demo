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
      const user = UserService.findById(Number(userProfile.sub))

      if (!user) {
        return status(404, errorResponse('NOT_FOUND', 'User not found'))
      }

      return {
        ...user,
        tokenSubject: userProfile.sub
      }
    },
    {
      response: {
        200: 'UserMeResponse',
        404: 'UserErrorResponse'
      },
      detail: {
        tags: ['Users'],
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
          sub: String(user.id),
          name: user.name
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
        tags: ['Users']
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
        tags: ['Users']
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
        tags: ['Users']
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
        tags: ['Users']
      }
    }
  )
