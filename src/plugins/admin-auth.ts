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

export namespace AdminAuthModel {
  export const jwtPayload = t.Object({
    sub: t.String({ minLength: 1 }),
    name: t.Optional(t.String({ minLength: 1 }))
  })

  export const unauthorizedResponse = ErrorModel.errorResponse
}

export const adminJwtPlugin = new Elysia({ name: 'admin-jwt-plugin' }).use(
  jwt({
    name: 'adminJwt',
    secret: jwtSecret,
    schema: AdminAuthModel.jwtPayload,
    exp: '7d'
  })
)

export const optionalAdminAuth = new Elysia({ name: 'optional-admin-auth' })
  .use(adminJwtPlugin)
  .derive({ as: 'scoped' }, async ({ headers, adminJwt }) => {
    const token = getBearerToken(headers.authorization)
    const profile = token ? await adminJwt.verify(token) : false

    return {
      adminAuth: {
        token,
        profile: profile || null
      }
    }
  })
  .as('scoped')

export const adminAuth = new Elysia({ name: 'admin-auth' })
  .use(adminJwtPlugin)
  .resolve({ as: 'scoped' }, async ({ headers, adminJwt, status }) => {
    const token = getBearerToken(headers.authorization)
    const profile = token ? await adminJwt.verify(token) : false

    if (!profile) {
      return status(401, errorResponse('UNAUTHORIZED', 'Unauthorized'))
    }

    return {
      adminAuth: {
        token,
        profile
      },
      adminProfile: profile
    }
  })
  .as('scoped')
