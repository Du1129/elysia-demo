import { cors } from '@elysia/cors'
import { Elysia } from 'elysia'

const parseOrigin = () => {
  const origin = Bun.env.CORS_ORIGIN

  if (!origin || origin === '*') return true

  return origin
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export const corsPlugin = new Elysia({ name: 'cors-plugin' }).use(
  cors({
    origin: parseOrigin(),
    credentials: Bun.env.CORS_CREDENTIALS !== 'false',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600
  })
)
