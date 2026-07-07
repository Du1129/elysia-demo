import { jwt } from '@elysia/jwt'
import { Elysia, t } from 'elysia'

import { ErrorModel } from './error'

const userJwtSecret =
  Bun.env.USER_JWT_SECRET ?? Bun.env.JWT_SECRET ?? 'elysia-demo-user-secret-change-me'

if (Bun.env.NODE_ENV === 'production' && !Bun.env.USER_JWT_SECRET && !Bun.env.JWT_SECRET) {
  throw new Error('USER_JWT_SECRET or JWT_SECRET is required in production')
}

const bearerPrefix = 'Bearer '

export namespace UserAuthModel {
  export const jwtPayload = t.Object({
    sub: t.String({ minLength: 1 }),
    name: t.Optional(t.String({ minLength: 1 }))
  })

  export const unauthorizedResponse = ErrorModel.errorResponse
}

export const userJwtPlugin = new Elysia({ name: 'user-jwt-plugin' }).use(
  jwt({
    name: 'userJwt',
    secret: userJwtSecret,
    schema: UserAuthModel.jwtPayload,
    exp: '7d'
  })
)

export const userAuth = new Elysia({ name: 'user-auth' })
  .use(userJwtPlugin)
  .derive({ as: 'scoped' }, async ({ headers, userJwt }) => {
    const authorization = headers.authorization
    const token = authorization?.startsWith(bearerPrefix)
      ? authorization.slice(bearerPrefix.length)
      : undefined
    const profile = token ? await userJwt.verify(token) : false

    return {
      userAuth: {
        token,
        profile: profile || null
      }
    }
  })
