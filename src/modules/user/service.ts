import { eq } from 'drizzle-orm'

import { db } from '../../db'
import { users } from '../../db/schema'
import type { UserModel } from './model'

const toPublicUser = ({ password: _password, ...user }: UserModel.UserRecord): UserModel.User =>
  user

export abstract class UserService {
  // 按自增 id 查找当前用户，并返回脱敏后的个人信息。
  static async findById(id: number) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1)

    return user ? toPublicUser(user) : undefined
  }
}
