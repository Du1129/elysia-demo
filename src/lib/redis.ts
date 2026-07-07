import { createClient } from 'redis'

const redisUrl = Bun.env.REDIS_URL ?? 'redis://localhost:6379'

export const redis = createClient({
  url: redisUrl
})

redis.on('error', (error) => {
  console.error('Redis error:', error)
})

export const getRedis = async () => {
  if (!redis.isOpen) {
    await redis.connect()
  }

  return redis
}
