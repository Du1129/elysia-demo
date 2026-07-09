import { Elysia } from 'elysia'

import { base } from './base'
import { health } from './health'
import { user } from './user'

export const modules = new Elysia({ name: 'modules' })
  .use(base)
  .use(health)
  .use(user)
