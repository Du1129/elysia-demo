import { Elysia } from 'elysia'

import { health } from './health'
import { user } from './user'

export const modules = new Elysia({ name: 'modules' })
  .use(health)
  .use(user)
