import { Queue } from 'bullmq'

import { queueConnection } from '../config/redis'

const queuePrefix = Bun.env.QUEUE_PREFIX ?? 'elysia-demo'
let defaultQueue: Queue | undefined

export const getDefaultQueue = () => {
  defaultQueue ??= new Queue('default', {
    connection: queueConnection,
    prefix: queuePrefix
  })

  return defaultQueue
}

export const queues = {
  get default() {
    return getDefaultQueue()
  }
} as const

export const closeQueues = async () => {
  if (defaultQueue) {
    await defaultQueue.close()
  }
}
