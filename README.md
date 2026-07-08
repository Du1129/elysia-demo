# elysia-demo

An Elysia.js TypeScript API template running on Bun.

## Scripts

```bash
bun install
bun run dev
bun run build
bun run start
```

## Database

```bash
bun run db:generate
bun run db:migrate
bun run db:studio
```

Configure PostgreSQL in local `.env` with object-style `DB_*` environment variables:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=elysia_demo
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false
```

Configure Redis with:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TLS=false
QUEUE_PREFIX=elysia-demo
```

Configure JWT with:

```env
JWT_SECRET=change-me
```

Request logs use Pino. Configure logging with:

```env
LOG_LEVEL=debug
```

Configure CORS with:

```env
CORS_ORIGIN=*
CORS_CREDENTIALS=true
```

Enable cron jobs with:

```env
CRON_ENABLED=false
CRON_HEARTBEAT_PATTERN="0 */5 * * * *"
```

Configure Qiniu with:

```env
QINIU_ACCESS_KEY=
QINIU_SECRET_KEY=
QINIU_BUCKET=
QINIU_DOMAIN=
QINIU_REGION=z2
QINIU_USE_HTTPS=true
QINIU_UPLOAD_URL=https://up-z2.qiniup.com
QINIU_TOKEN_EXPIRES=3600
```

## Endpoints

- `GET /`
- `GET /health`
- `GET /health/db`
- `GET /health/redis`
- `GET /openapi`
- `GET /openapi/json`
- `GET /users`
- `GET /users/me` with `Authorization: Bearer <token>`
- `GET /users/:id`
- `POST /users/token/:id`
- `POST /users` with JSON body `{ "name": "July", "email": "july@example.com" }`

The seeded in-memory user id is `018f3f79-7a13-7c0d-9d8e-fcc6e2f14a10`.

## Error Response

All API errors use the same response shape:

```json
{
  "code": "NOT_FOUND",
  "message": "Route not found"
}
```

Development responses may include a `detail` field. Production responses never
include `detail`.

## Auth Plugins

Admin and client modules can opt into token parsing at their module entry.
Use `adminAuth` for backend/admin modules and `userAuth` for client/user modules.
Common modules should not mount either auth plugin.

- admin modules use `adminAuth` and `adminJwtPlugin` from `src/plugins/admin-auth.ts`
- user/client modules use `userAuth` and `userJwtPlugin` from `src/plugins/user-auth.ts`
- both plugins use the same `JWT_SECRET`

Expected authorization header:

```txt
Authorization: Bearer <token>
```

## Structure

```txt
src/
  index.ts
  app.ts
  db/
    index.ts
    schema.ts
  lib/
    qiniu.ts
    redis.ts
  utils/
    datetime.ts
  plugins/
    admin-auth.ts
    cors.ts
    error.ts
    logger.ts
    queue.ts
    scheduler.ts
    user-auth.ts
  queues/
    index.ts
  modules/
    index.ts
    health/
      index.ts
      model.ts
      service.ts
    user/
      index.ts
      model.ts
      service.ts
```
