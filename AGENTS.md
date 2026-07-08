# 仓库指南

## 项目结构与模块组织

这是一个 Bun + Elysia 的 TypeScript API 项目。运行入口是 `src/index.ts`，应用组装在 `src/app.ts`。

- `src/modules/<feature>/`：按功能拆分模块。每个模块建议将路由放在 `index.ts`，请求/响应 schema 和类型放在 `model.ts`，业务逻辑放在 `service.ts`。
- `src/modules/index.ts`：业务模块聚合入口。新增模块后在这里 `.use()`，不要让 `src/app.ts` 持续增加业务模块引用。
- `src/plugins/`：可复用的 Elysia 插件，例如 CORS、JWT 鉴权、队列挂载、定时任务、请求日志和全局错误处理。
- `src/queues/`：BullMQ 队列定义。HTTP 层只负责入队，实际 worker 应独立进程启动。
- `src/db/`：Drizzle 数据库客户端和 PostgreSQL schema。
- `src/config/`：环境变量解析和基础设施配置，例如 Redis/BullMQ 连接配置。
- `src/utils/`：跨模块复用的纯工具函数，例如日期时间格式化。
- `drizzle/`：Drizzle 生成的 SQL migration 和元数据。
- `.agents/skills/elysiajs/`：项目内安装的 ElysiaJS agent skill 和示例。
- 当前还没有测试目录；新增测试时可放在 `src/**/*.test.ts` 或 `tests/`。

## 构建、测试与开发命令

本项目统一使用 Bun。

```bash
bun install          # 根据 bun.lock 安装依赖
bun run dev         # 热重载启动 Elysia
bun run start       # 直接运行 src/index.ts
bun run debug       # 在 localhost:6499 启动 Bun inspector
bun run typecheck   # 执行 TypeScript 类型检查
bun run build       # 打包 API 到 dist/
```

数据库相关命令：

```bash
bun run db:generate # 根据 src/db/schema/index.ts 生成 migration
bun run db:migrate  # 执行已生成的 migration
bun run db:push     # 开发期直接同步 schema 到数据库
bun run db:studio   # 打开 Drizzle Studio
```

## 代码风格与命名约定

使用严格 TypeScript。遵循现有风格：2 空格缩进、单引号、不写分号、模块/插件/service 使用具名导出。路由 handler 保持轻量，复杂逻辑放进 `service.ts`。请求和响应必须使用 Elysia/TypeBox schema 校验；涉及数据库模型时，优先用 `drizzle-typebox` 从 Drizzle schema 派生。

## Agent Skill 使用说明

本仓库已安装 ElysiaJS skill：[.agents/skills/elysiajs/SKILL.md](/Users/july/be_proj/elysia-demo/.agents/skills/elysiajs/SKILL.md)。Agent 在修改 Elysia 路由、插件、校验、JWT、OpenAPI、Drizzle 集成、WebSocket 或测试前，应先阅读该文件。需要更深入的指导时，只读取相关的 `plugins/`、`integrations/`、`references/` 或 `examples/` 文件。示例代码仅作参考，必须适配本项目的 feature-module 结构，不要直接照搬。

## 测试规范

当前未配置专门测试框架。新增测试时优先使用 Bun 内置 test runner，文件命名为 `*.test.ts`。测试应尽量靠近被测功能，例如 `src/modules/user/service.test.ts`。至少运行：

```bash
bun test
bun run typecheck
```

## Commit 与 Pull Request 规范

当前工作区没有可参考的 Git 提交历史。提交信息使用简短祈使句，例如 `add user module` 或 `wire drizzle migrations`。PR 应包含变更摘要、已执行的验证命令、数据库 migration 说明，以及任何 API 契约变化；如有关联 issue，应一并链接。

## 安全与配置提示

不要提交真实密钥。`.env` 只保留在本地，用于配置 `PORT`、`JWT_SECRET` 和 PostgreSQL 的 `DB_*` 对象式环境变量。生产环境必须提供非默认的 `JWT_SECRET`。
