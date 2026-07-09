import { eq } from 'drizzle-orm'

import { db } from '../../db'
import { users } from '../../db/schema'
import { serviceError } from '../../model'
import { md5 } from '../../utils/crypto'
import type { UserModel } from './model'
import { log } from '../../plugins/logger'

const toPublicUser = ({ password: _password, ...user }: UserModel.UserRecord): UserModel.User =>
  user
const hasUpdateFields = (body: UserModel.UpdateBody) => Object.keys(body).length > 0
const sanitizeUpdateBody = (body: UserModel.UpdateBody) => {
  const {
    id: _id,
    updatedAt: _updatedAt,
    password: _password,
    ...updateBody
  } = body as UserModel.UpdateBody & {
    id?: unknown
    updatedAt?: unknown
    password?: unknown
  }

  return updateBody
}
const isUniqueViolation = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code?: unknown }).code === '23505'

export abstract class UserService {
  // 按自增 id 查找用户完整记录，包含 password，仅供模块内部校验使用。
  static async findRecordById(id: number) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1)

    return user
  }

  // 按自增 id 查找当前用户，并返回脱敏后的个人信息。
  static async findById(id: number) {
    const user = await UserService.findRecordById(id)

    return user ? toPublicUser(user) : undefined
  }

  // 校验旧密码后更新当前用户密码。
  static async changePassword(userId: number, body: UserModel.ChangePasswordBody) {
    const user = await UserService.findRecordById(userId)

    if (!user) {
      return serviceError(404, 'NOT_FOUND', '该用户不存在')
    }

    if (user.password !== md5(body.oldPassword)) {
      return serviceError(400, 'BAD_REQUEST', '旧密码错误')
    }

    await db
      .update(users)
      .set({
        password: md5(body.newPassword)
      })
      .where(eq(users.id, userId))

    return {
      err: null
    }
  }

  // 修改当前用户资料，排除 id、updatedAt、password。
  static async update(userId: number, body: UserModel.UpdateBody) {
    const updateBody = sanitizeUpdateBody(body)

    if (!hasUpdateFields(updateBody)) {
      return serviceError(400, 'BAD_REQUEST', '没有可修改字段')
    }

    try {
      const [user] = await db
        .update(users)
        .set(updateBody)
        .where(eq(users.id, userId))
        .returning()

      if (!user) {
        return serviceError(404, 'NOT_FOUND', '该用户不存在')
      }

      return {
        err: null,
        user: toPublicUser(user)
      }
    } catch (error) {
      log.error(error);
      if (isUniqueViolation(error)) {
        return serviceError(409, 'CONFLICT', '手机号或邮箱已存在')
      }
      throw error
    }
  }
}
