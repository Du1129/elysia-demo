import { t, type Static } from 'elysia'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-typebox'

import { users } from '../../db/schema'
import { spread } from '../../db/utils'
import { ErrorModel } from '../../plugins/error'

export namespace UserModel {
  const nullableParentId = () => t.Union([t.Number({ minimum: 1 }), t.Null()])
  const nullableString = () => t.Union([t.String(), t.Null()])
  const email = () => t.String({ format: 'email', error: 'email格式错误' })

  export const db = {
    insert: spread(createInsertSchema(users, {
      parentId: t.Optional(nullableParentId()),
      name: t.String({ minLength: 1 }),
      phone: t.String({ minLength: 1 }),
      email: email(),
      password: t.String({ minLength: 6 }),
      description: t.Optional(nullableString()),
      status: t.Optional(t.Number({ minimum: 0 })),
      avatarImgKey: t.Optional(nullableString())
    })),
    select: spread(createSelectSchema(users, {
      email: email()
    })),
    update: spread(createUpdateSchema(users, {
      parentId: nullableParentId(),
      name: t.String({ minLength: 1 }),
      phone: t.String({ minLength: 1 }),
      email: email(),
      password: t.String({ minLength: 6 }),
      description: nullableString(),
      status: t.Number({ minimum: 0 }),
      avatarImgKey: nullableString()
    }))
  } as const

  const { password: _password, ...publicUserFields } = db.select

  export const userRecord = t.Object(db.select)
  export const user = t.Object(publicUserFields)

  export const idParams = t.Object({
    id: t.Number({ minimum: 1 })
  })

  export const createBody = t.Object({
    parentId: db.insert.parentId,
    name: db.insert.name,
    phone: db.insert.phone,
    email: db.insert.email,
    password: db.insert.password,
    description: db.insert.description,
    status: db.insert.status,
    avatarImgKey: db.insert.avatarImgKey
  })

  export const updateBody = t.Object({
    parentId: db.update.parentId,
    name: db.update.name,
    phone: db.update.phone,
    email: db.update.email,
    password: db.update.password,
    description: db.update.description,
    status: db.update.status,
    avatarImgKey: db.update.avatarImgKey
  })

  export const listResponse = t.Array(user)

  export const tokenResponse = t.Object({
    token: t.String()
  })

  export const notFoundResponse = ErrorModel.errorResponse

  export const meResponse = t.Object({
    ...publicUserFields,
    tokenUserId: t.Number()
  })

  export const models = {
    UserResponse: user,
    UserListResponse: listResponse,
    UserUpdateBody: updateBody,
    UserTokenResponse: tokenResponse,
    UserMeResponse: meResponse,
    UserErrorResponse: notFoundResponse
  } as const

  export type User = Static<typeof user>
  export type UserRecord = Static<typeof userRecord>
  export type CreateBody = Static<typeof createBody>
  export type UpdateBody = Static<typeof updateBody>
}
