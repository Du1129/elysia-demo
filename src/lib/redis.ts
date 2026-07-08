import { createClient } from 'redis'

import { redisClientOptions } from '../config/redis'

export const redis = createClient(redisClientOptions)

redis.on('error', (error) => {
  console.error('Redis error:', error)
})

export const getRedis = async () => {
  if (!redis.isOpen) {
    await redis.connect()
  }

  return redis
}
