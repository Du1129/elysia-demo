import { jwt } from '@elysia/jwt'
import { Elysia, t } from 'elysia'

import { ErrorModel } from './error'

const adminJwtSecret =
  Bun.env.ADMIN_JWT_SECRET ?? Bun.env.JWT_SECRET ?? 'elysia-demo-admin-secret-change-me'

if (Bun.env.NODE_ENV === 'production' && !Bun.env.ADMIN_JWT_SECRET && !Bun.env.JWT_SECRET) {
  throw new Error('ADMIN_JWT_SECRET or JWT_SECRET is required in production')
}

const bearerPrefix = 'Bearer '

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
    secret: adminJwtSecret,
    schema: AdminAuthModel.jwtPayload,
    exp: '7d'
  })
)

export const adminAuth = new Elysia({ name: 'admin-auth' })
  .use(adminJwtPlugin)
  .derive({ as: 'scoped' }, async ({ headers, adminJwt }) => {
    const authorization = headers.authorization
    const token = authorization?.startsWith(bearerPrefix)
      ? authorization.slice(bearerPrefix.length)
      : undefined
    const profile = token ? await adminJwt.verify(token) : false

    return {
      adminAuth: {
        token,
        profile: profile || null
      }
    }
  })
