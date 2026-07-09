import { jwt } from '@elysia/jwt'
import { Elysia, t } from 'elysia'

import { ErrorModel, errorResponse } from './error'

const jwtSecret = Bun.env.JWT_SECRET ?? 'elysia-demo-secret-change-me'

if (Bun.env.NODE_ENV === 'production' && !Bun.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required in production')
}

const bearerPrefix = 'Bearer '

const getBearerToken = (authorization: string | undefined) =>
  authorization?.startsWith(bearerPrefix)
    ? authorization.slice(bearerPrefix.length)
    : undefined

export namespace UserAuthModel {
  export const jwtPayload = t.Object({
    userId: t.Number({ minimum: 1 }),
    name: t.Optional(t.String({ minLength: 1 })),
    phone: t.String({ minLength: 1 }),
    email: t.String({ format: 'email' }),
    status: t.Number()
  })

  export const unauthorizedResponse = ErrorModel.errorResponse
}

export const userJwtPlugin = new Elysia({ name: 'user-jwt-plugin' }).use(
  jwt({
    name: 'userJwt',
    secret: jwtSecret,
    schema: UserAuthModel.jwtPayload,
    exp: '7d'
  })
)

export const optionalUserAuth = new Elysia({ name: 'optional-user-auth' })
  .use(userJwtPlugin)
  .derive({ as: 'scoped' }, async ({ headers, userJwt }) => {
    const token = getBearerToken(headers.authorization)
    const profile = token ? await userJwt.verify(token) : false

    return {
      userAuth: {
        token,
        profile: profile || null
      }
    }
  })
  .as('scoped')

export const userAuth = new Elysia({ name: 'user-auth' })
  .use(userJwtPlugin)
  .resolve({ as: 'scoped' }, async ({ headers, userJwt, status }) => {
    const token = getBearerToken(headers.authorization)
    const profile = token ? await userJwt.verify(token) : false

    if (!profile) {
      return status(401, errorResponse('UNAUTHORIZED', 'Unauthorized'))
    }

    return {
      userAuth: {
        token,
        profile
      },
      userProfile: profile
    }
  })
  .as('scoped')
