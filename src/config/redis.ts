import type { ConnectionOptions } from 'bullmq'
import type { RedisClientOptions } from 'redis'

const optional = (value: string | undefined) => value || undefined
const keepAliveInitialDelay = 5_000
const reconnectDelay = (retries: number) => Math.min(retries * 100, 3_000)

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
      tls: true,
      reconnectStrategy: reconnectDelay
    }
    : {
      host: redisConfig.host,
      port: redisConfig.port,
      keepAlive: true,
      keepAliveInitialDelay,
      reconnectStrategy: reconnectDelay
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
  keepAlive: keepAliveInitialDelay,
  retryStrategy: reconnectDelay,
  ...(redisConfig.tls ? { tls: {} } : {})
}
