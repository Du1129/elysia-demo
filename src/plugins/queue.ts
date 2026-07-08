import { Elysia } from 'elysia'

import { closeQueues, queues } from '../queues'

export const queuePlugin = new Elysia({ name: 'queue-plugin' })
  .decorate('queues', queues)
  .onStop(closeQueues)
  .as('scoped')
