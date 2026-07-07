import { t, type Static } from 'elysia'
import { createInsertSchema, createSelectSchema } from 'drizzle-typebox'

import { users } from '../../db/schema'
import { ErrorModel } from '../../plugins/error'

export namespace UserModel {
  export const user = createSelectSchema(users)

  export const idParams = t.Object({
    id: t.String({ minLength: 1 })
  })

  const insertUser = createInsertSchema(users, {
    name: t.String({ minLength: 1 }),
    email: t.String({ format: 'email' , error: "email格式错误"})
  });

  export const createBody = t.Pick(insertUser, ['name', 'email'])

  export const listResponse = t.Array(user)

  export const tokenResponse = t.Object({
    token: t.String()
  })

  export const notFoundResponse = ErrorModel.errorResponse

  export const meResponse = t.Object({
    id: t.String(),
    name: t.String(),
    email: t.String(),
    createdAt: t.Date(),
    tokenSubject: t.String()
  })

  export const models = {
    UserResponse: user,
    UserListResponse: listResponse,
    UserTokenResponse: tokenResponse,
    UserMeResponse: meResponse,
    UserErrorResponse: notFoundResponse
  } as const

  export type User = Static<typeof user>
  export type CreateBody = Static<typeof createBody>
}
