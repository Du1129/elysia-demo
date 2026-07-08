import type { ConnectionOptions } from 'bullmq'
import type { RedisClientOptions } from 'redis'

const optional = (value: string | undefined) => value || undefined

export const redisConfig = {
  host: Bun.env.REDIS_HOST ?? 'localhost',
  port: Number(Bun.env.REDIS_PORT ?? 6379),
  username: optional(Bun.env.REDIS_USERNAME),
  password: optional(Bun.env.REDIS_PASSWORD),
  database: Number(Bun.env.REDIS_DB ?? 0),
  tls: Bun.env.REDIS_TLS === 'true'
}

export const redisClientOptions: RedisClientOptions = {
  socket: redisConfig.tls
    ? {
      host: redisConfig.host,
      port: redisConfig.port,
      tls: true
    }
    : {
      host: redisConfig.host,
      port: redisConfig.port
    },
  username: redisConfig.username,
  password: redisConfig.password,
  database: redisConfig.database
}

export const queueConnection: ConnectionOptions = {
  host: redisConfig.host,
  port: redisConfig.port,
  username: redisConfig.username,
  password: redisConfig.password,
  db: redisConfig.database,
  ...(redisConfig.tls ? { tls: {} } : {})
}
