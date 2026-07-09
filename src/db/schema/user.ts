import { integer, pgTable, text } from 'drizzle-orm/pg-core'

import { withBaseColumns } from './common'

export const users = pgTable('users', withBaseColumns({
  parentId: integer('parent_id'),
  name: text('name').notNull(),
  phone: text('phone').notNull().unique(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  description: text('description'),
  // 用户状态：0=禁用，1=启用
  status: integer('status').notNull().default(1),
  avatarImgKey: text('avatar_img_key')
}))
