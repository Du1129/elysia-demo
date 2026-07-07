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
REDIS_URL=redis://localhost:6379
```

Configure JWT with:

```env
JWT_SECRET=change-me
```

## Endpoints

- `GET /`
- `GET /health`
- `GET /health/db`
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
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Route not found"
  }
}
```

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
    redis.ts
  plugins/
    admin-auth.ts
    error.ts
    user-auth.ts
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
