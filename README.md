# elysia-demo

基于 **Bun + Elysia** 的 TypeScript 后端 API 项目模板，集成 PostgreSQL（Drizzle ORM）、Redis、BullMQ 消息队列、JWT 鉴权、OpenAPI 文档、Pino 日志、CORS、定时任务和七牛云对象存储。

## 技术栈

| 类别         | 技术                                                           |
| ------------ | -------------------------------------------------------------- |
| 运行时       | [Bun](https://bun.sh)                                          |
| Web 框架     | [Elysia](https://elysiajs.com) + TypeScript                    |
| 数据库       | PostgreSQL，通过 [Drizzle ORM](https://orm.drizzle.team) 访问 |
| Schema 校验  | [TypeBox](https://github.com/sinclairzx81/typebox) + drizzle-typebox |
| 缓存 / 队列  | Redis（[node-redis](https://github.com/redis/node-redis) + [BullMQ](https://bullmq.io)） |
| 鉴权         | JWT（`@elysia/jwt`）                                           |
| API 文档     | OpenAPI 3.0（`@elysia/openapi`）                               |
| 日志         | [Pino](https://getpino.io)                                    |
| 定时任务     | `@elysia/cron`                                                 |
| 对象存储     | 七牛云 Kodo                                                    |

## 快速开始

```bash
# 安装依赖
bun install

# 复制环境变量配置
cp .env.example .env

# 编辑 .env，填入数据库和 Redis 连接信息

# 同步数据库 schema（开发环境）
bun run db:push

# 启动开发服务器（热重载）
bun run dev
```

服务默认监听 `http://localhost:3000`（可通过 `PORT` 环境变量修改）。
启动后访问 `GET /openapi` 查看 Swagger UI，或 `GET /openapi/json` 获取 OpenAPI JSON。

## 项目结构

```
src/
├── index.ts                  # 入口：启动 HTTP 服务器
├── app.ts                    # 应用组装：注册插件、OpenAPI、根路由
├── config/
│   └── redis.ts              # Redis / BullMQ 连接配置
├── db/
│   ├── index.ts              # Drizzle 客户端（postgres-js）
│   ├── utils.ts              # drizzle-typebox 辅助函数（spread / spreads）
│   └── schema/
│       ├── index.ts          # 汇总导出
│       ├── common.ts         # 通用表字段（id, createdAt, updatedAt, deletedAt）
│       └── user.ts           # users 表
├── lib/
│   ├── redis.ts              # Redis 客户端（懒连接）
│   ├── mail.ts               # Nodemailer SMTP 客户端
│   └── qiniu.ts              # 七牛云上传令牌、公开 URL、BucketManager
├── enums/
│   ├── index.ts              # 枚举汇总导出
│   └── sms.ts                # 邮箱验证码场景枚举
├── utils/
│   ├── datetime.ts           # 日期时间格式化（基于 dayjs）
│   └── crypto.ts             # MD5 工具
├── plugins/
│   ├── cors.ts               # CORS（支持多域名、Credentials）
│   ├── error.ts              # 全局错误处理 + errorResponse 工厂
│   ├── logger.ts             # Pino 请求日志
│   ├── models.ts             # 公共 OpenAPI / response model 注册
│   ├── admin-auth.ts         # 后台 JWT 鉴权（adminJwt / adminAuth / optionalAdminAuth）
│   ├── user-auth.ts          # 客户端 JWT 鉴权（userJwt / userAuth / optionalUserAuth）
│   ├── queue.ts              # BullMQ 队列挂载（decorate + onStop）
│   └── scheduler.ts          # 定时任务（基于 @elysia/cron）
├── queues/
│   └── index.ts              # BullMQ 队列定义（default 队列）
└── modules/
    ├── index.ts              # 业务模块聚合入口
    ├── base/                 # 登录、图形验证码、邮箱验证码
    │   ├── index.ts          # 路由：GET /base/captcha, POST /base/login, POST /base/sms, POST /base/register, POST /base/resetPassword
    │   ├── model.ts          # 请求/响应 TypeBox schema
    │   └── service.ts        # 验证码生成/校验、登录逻辑
    ├── health/               # 健康检查
    │   ├── index.ts          # 路由：GET /health, /health/db, /health/redis
    │   ├── model.ts          # 响应 schema
    │   └── service.ts        # DB / Redis 连通性检测
    └── user/                 # 用户管理
        ├── index.ts          # 路由：GET /users/current
        ├── model.ts          # 请求/响应 TypeBox schema（drizzle-typebox 派生）
        └── service.ts        # 当前用户查询
```

### 模块约定

- **`index.ts`** —— 路由定义，handler 保持轻量，只调用 service 和组装响应
- **`model.ts`** —— TypeBox schema 定义（请求 body / query / params 和响应），通过 `.model()` 注册
- **`service.ts`** —— 业务逻辑，以 `abstract class` 静态方法组织
- 新增模块后，在 `src/modules/index.ts` 中 `.use()` 注册

## 环境变量

完整配置见 `.env.example`。以下按功能分组说明：

### 服务器

| 变量       | 默认值        | 说明          |
| ---------- | ------------- | ------------- |
| `PORT`     | `3000`        | HTTP 监听端口 |
| `NODE_ENV` | `development` | 运行环境      |

### 数据库（PostgreSQL）

| 变量          | 默认值        | 说明         |
| ------------- | ------------- | ------------ |
| `DB_HOST`     | `localhost`   | 数据库主机   |
| `DB_PORT`     | `5432`        | 数据库端口   |
| `DB_NAME`     | `elysia_demo` | 数据库名称   |
| `DB_USER`     | `postgres`    | 数据库用户   |
| `DB_PASSWORD` | `postgres`    | 数据库密码   |
| `DB_SSL`      | `false`       | 是否启用 SSL |

### Redis

| 变量             | 默认值         | 说明                        |
| ---------------- | -------------- | --------------------------- |
| `REDIS_HOST`     | `localhost`    | Redis 主机                  |
| `REDIS_PORT`     | `6379`         | Redis 端口                  |
| `REDIS_USERNAME` | —              | Redis 用户名（ACL）         |
| `REDIS_PASSWORD` | —              | Redis 密码                  |
| `REDIS_DB`       | `0`            | Redis 数据库编号            |
| `REDIS_TLS`      | `false`        | 是否启用 TLS                |

### JWT

| 变量         | 说明                                     |
| ------------ | ---------------------------------------- |
| `JWT_SECRET` | JWT 签名密钥（生产环境必须设置，否则抛错） |

### 验证码

| 变量                 | 默认值     | 说明                   |
| -------------------- | ---------- | ---------------------- |
| `CAPTCHA_EXPIRES_IN` | `300`     | 图形验证码过期时间（秒） |
| `CAPTCHA_KEY_PREFIX` | `captcha` | 图形验证码 Redis 键前缀  |
| `SMS_CODE_EXPIRES_IN` | `300`    | 邮箱验证码过期时间（秒） |
| `SMS_RATE_LIMIT_SECONDS` | `60` | 同一邮箱同一场景发送间隔 |
| `SMS_KEY_PREFIX` | `sms`       | 邮箱验证码 Redis 键前缀  |

### 日志

| 变量        | 默认值  | 说明                                               |
| ----------- | ------- | -------------------------------------------------- |
| `LOG_LEVEL` | `debug` | Pino 日志级别（fatal/error/warn/info/debug/trace）  |

### CORS

| 变量               | 默认值 | 说明                                |
| ------------------ | ------ | ----------------------------------- |
| `CORS_ORIGIN`      | `*`    | 允许的源（逗号分隔多个域名）        |
| `CORS_CREDENTIALS` | `true` | 是否允许携带 Cookie / Authorization |

### 定时任务

| 变量                    | 默认值           | 说明                       |
| ----------------------- | ---------------- | -------------------------- |
| `CRON_ENABLED`          | `false`          | 是否启用心跳定时任务       |
| `CRON_HEARTBEAT_PATTERN` | `0 */5 * * * *` | 心跳 cron 表达式（秒级）   |

### 邮件服务（SMTP）

| 变量            | 默认值 | 说明                               |
| --------------- | ------ | ---------------------------------- |
| `SMTP_HOST`     | —      | SMTP 服务器地址                    |
| `SMTP_PORT`     | `465`  | SMTP 端口                          |
| `SMTP_SECURE`   | `true` | 是否使用 TLS，465 通常为 true      |
| `SMTP_USER`     | —      | SMTP 用户名                        |
| `SMTP_PASSWORD` | —      | SMTP 密码或邮箱授权码              |
| `SMTP_FROM`     | —      | 默认发件人；为空时使用 `SMTP_USER` |

### BullMQ 队列

| 变量           | 默认值        | 说明        |
| -------------- | ------------- | ----------- |
| `QUEUE_PREFIX` | `elysia-demo` | 队列键前缀  |

### 七牛云

| 变量                 | 默认值 | 说明                              |
| -------------------- | ------ | --------------------------------- |
| `QINIU_UPLOAD_URL`   | —      | 上传域名                          |
| `QINIU_ACCESS_KEY`   | —      | Access Key                        |
| `QINIU_SECRET_KEY`   | —      | Secret Key                        |
| `QINIU_BUCKET`       | —      | 存储空间名称                      |
| `QINIU_DOMAIN`       | —      | CDN / 公开访问域名                |
| `QINIU_REGION`       | `z2`   | 存储区域（z0/z1/z2/na0/as0/cn-east-2） |
| `QINIU_USE_HTTPS`    | `true` | 是否使用 HTTPS                    |
| `QINIU_TOKEN_EXPIRES` | `3600` | 上传令牌过期时间（秒）            |

## API 端点

### 通用

| 方法 | 路径           | 说明             | Auth |
| ---- | -------------- | ---------------- | ---- |
| GET  | `/`            | 根路径，返回消息 | 无   |
| GET  | `/openapi`     | Swagger UI       | 无   |
| GET  | `/openapi/json`| OpenAPI JSON     | 无   |

### Base — 登录与验证码

| 方法 | 路径            | 说明         | Auth |
| ---- | --------------- | ------------ | ---- |
| GET  | `/base/captcha` | 获取图形验证码 | 无   |
| POST | `/base/login`   | 用户登录      | 无   |
| POST | `/base/sms`     | 发送邮箱验证码 | 无   |
| POST | `/base/register` | 用户注册     | 无   |
| POST | `/base/resetPassword` | 忘记密码 | 无   |

**获取验证码**：`GET /base/captcha?width=120&height=40&color=%23333`

返回：

```json
{
  "captchaId": "uuid",
  "data": "data:image/svg+xml;base64,...",
  "expiresIn": 300
}
```

**登录**：`POST /base/login`，请求体：

```json
{
  "account": "13800000000",
  "password": "password123",
  "captchaId": "...",
  "captchaCode": "abcd"
}
```

`account` 支持手机号或邮箱。登录成功返回 JWT token。

**发送邮箱验证码**：`POST /base/sms`，请求体：

```json
{
  "email": "user@example.com",
  "scene": "regist"
}
```

`scene` 只支持 `regist` 和 `reset`，分别表示注册账号和忘记密码。同一邮箱同一场景 60 秒内只能发送一次。发送成功返回 `204 No Content`，无响应体。

**注册**：`POST /base/register`，请求体：

```json
{
  "phone": "13800000000",
  "email": "user@example.com",
  "password": "password123",
  "smsCode": "123456"
}
```

注册使用 `regist` 场景的邮箱验证码。成功后密码以 MD5 写入数据库，用户名按时间戳生成，例如 `用户281234567890`。

**忘记密码**：`POST /base/resetPassword`，请求体：

```json
{
  "email": "user@example.com",
  "password": "new-password123",
  "smsCode": "123456"
}
```

忘记密码使用 `reset` 场景的邮箱验证码。验证码错误时不会删除 Redis 中的验证码和发送频率锁；重置成功返回 `204 No Content`。

### Health — 健康检查

| 方法 | 路径         | 说明                         | Auth |
| ---- | ------------ | ---------------------------- | ---- |
| GET  | `/health`    | 服务状态（uptime）           | 无   |
| GET  | `/health/db` | 数据库连通性 + 延迟          | 无   |
| GET  | `/health/redis` | Redis 连通性 + 延迟       | 无   |
| GET  | `/health/mail` | SMTP 邮件服务连通性 + 延迟 | 无   |

### Users — 用户管理

| 方法   | 路径              | 说明               | Auth         |
| ------ | ----------------- | ------------------ | ------------ |
| GET    | `/users/current`  | 当前登录用户信息   | Bearer Token |

## 鉴权

项目提供两套独立的 JWT 鉴权插件，分别面向后台管理员和前端用户，使用相同的 `JWT_SECRET`。

| 插件               | 用途                           | 路由注入         |
| -------------------- | ------------------------------ | ---------------- |
| `adminAuth`          | 强制鉴权，无有效 token 返回 401 | `adminProfile`   |
| `optionalAdminAuth`  | 可选鉴权，解析成功注入 profile  | `adminAuth`      |
| `userAuth`           | 强制鉴权，无有效 token 返回 401 | `userProfile`    |
| `optionalUserAuth`   | 可选鉴权，解析成功注入 profile  | `userAuth`       |

```txt
Authorization: Bearer <token>
```

JWT payload 结构：

```json
{
  "userId": 1,
  "name": "July",
  "phone": "13800000000",
  "email": "july@example.com",
  "status": 1
}
```

## 数据库

基于 PostgreSQL，使用 Drizzle ORM。

### 通用表字段

`src/db/schema/common.ts` 提供 `withBaseColumns(fields)` 工具，自动为表添加：

- `id` —— 自增主键（integer, GENERATED BY DEFAULT AS IDENTITY）
- `createdAt` —— 创建时间（timestamptz, default now）
- `updatedAt` —— 更新时间（timestamptz, default now, auto-update）

可选软删除：`withBaseColumns(fields, { softDelete: true })` 额外加上 `deletedAt`。

### users 表

| 列             | 类型          | 说明           |
| -------------- | ------------- | -------------- |
| `id`           | integer (PK)  | 自增主键       |
| `parent_id`    | integer       | 父用户 ID      |
| `name`         | text (NOT NULL)| 姓名          |
| `phone`        | text (UNIQUE, NOT NULL) | 手机号 |
| `email`        | text (UNIQUE, NOT NULL) | 邮箱   |
| `password`     | text (NOT NULL)| 密码（MD5 存储）|
| `description`  | text          | 描述           |
| `status`       | integer (default 1) | 状态（1=正常）|
| `avatar_img_key`| text         | 头像七牛云 key |
| `created_at`   | timestamptz   | 创建时间       |
| `updated_at`   | timestamptz   | 更新时间       |

### drizzle-typebox 集成

`src/db/utils.ts` 提供的 `spread()` 和 `spreads()` 函数展开 TypeBox schema 的 `properties`，避免了 Drizzle schema 的嵌套包装。模块内使用 `createInsertSchema` / `createSelectSchema` / `createUpdateSchema` 从 Drizzle 表定义自动派生校验 schema。

## 错误响应

所有 API 错误统一使用以下格式：

```json
{
  "code": "NOT_FOUND",
  "message": "Route not found"
}
```

错误码列表：`BAD_REQUEST`、`UNAUTHORIZED`、`FORBIDDEN`、`CONFLICT`、`NOT_FOUND`、`VALIDATION_ERROR`、`DATABASE_ERROR`、`CACHE_ERROR`、`INTERNAL_SERVER_ERROR`。

开发环境（`NODE_ENV !== 'production'`）的错误响应可能包含 `detail` 字段用于调试。

## 命令参考

```bash
# 开发
bun run dev          # 热重载启动
bun run start        # 直接启动
bun run debug        # 带 Bun Inspector 启动（localhost:6499）

# 构建 & 类型检查
bun run build        # 打包到 dist/
bun run typecheck    # TypeScript 类型检查

# 数据库
bun run db:generate  # 根据 schema 生成 migration
bun run db:migrate   # 执行 migration
bun run db:push      # 开发环境直接同步 schema
bun run db:studio    # 打开 Drizzle Studio

# 测试（待实现）
bun test
```
