import { t, type Static } from 'elysia'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-typebox'

import { users } from '../../db/schema'
import { spread } from '../../db/utils'

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
      description: nullableString(),
      status: t.Number({ minimum: 0 }),
      avatarImgKey: nullableString()
    }))
  } as const

  const { password: _password, ...publicUserFields } = db.select
  const {
    id: _id,
    updatedAt: _updatedAt,
    password: _updatePassword,
    ...updatableUserFields
  } = db.update

  export const userRecord = t.Object(db.select)
  export const user = t.Object(publicUserFields)
  export const changePasswordBody = t.Object({
    oldPassword: t.String({ minLength: 1 }),
    newPassword: db.insert.password
  })
  export const updateBody = t.Object(updatableUserFields)

  export const models = {
    UserResponse: user,
    UserChangePasswordBody: changePasswordBody,
    UserUpdateBody: updateBody
  } as const

  export type User = Static<typeof user>
  export type UserRecord = Static<typeof userRecord>
  export type ChangePasswordBody = Static<typeof changePasswordBody>
  export type UpdateBody = Static<typeof updateBody>
}
