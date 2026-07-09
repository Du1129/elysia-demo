import { client } from '../../db'
import { redisConfig } from '../../config/redis'
import { getRedis } from '../../lib/redis'

const startedAt = Date.now()

export abstract class HealthService {
  // 返回进程基础存活状态。
  static check() {
    return {
      status: 'ok' as const,
      uptime: (Date.now() - startedAt) / 1000
    }
  }

  // 通过简单查询确认 PostgreSQL 连接可用。
  static async checkDatabase() {
    const started = performance.now()

    await client`select 1`

    return {
      status: 'ok' as const,
      latencyMs: Math.round(performance.now() - started),
      database: Bun.env.DB_NAME ?? 'elysia_demo',
      host: Bun.env.DB_HOST ?? 'localhost',
      port: Number(Bun.env.DB_PORT ?? 5432)
    }
  }

  // 通过 PING 确认 Redis 连接可用。
  static async checkRedis() {
    const started = performance.now()
    const redis = await getRedis()

    await redis.ping()

    return {
      status: 'ok' as const,
      latencyMs: Math.round(performance.now() - started),
      host: redisConfig.host,
      port: redisConfig.port
    }
  }
}
