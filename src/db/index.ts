import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from './schema'

const databaseConfig = {
  host: Bun.env.DB_HOST ?? 'localhost',
  port: Number(Bun.env.DB_PORT ?? 5432),
  database: Bun.env.DB_NAME ?? 'elysia_demo',
  username: Bun.env.DB_USER ?? 'postgres',
  password: Bun.env.DB_PASSWORD ?? 'postgres',
  ssl: Bun.env.DB_SSL === 'true'
}

export const client = postgres(databaseConfig)

export const db = drizzle(client, { schema })
export type Db = typeof db
