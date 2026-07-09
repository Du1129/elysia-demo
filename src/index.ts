import { app } from './app'
import { isMailConfigured } from './config/mail'
import { HealthService } from './modules/health/service'
import { log } from './plugins/logger'

const port = Number(Bun.env.PORT ?? 3000)

const checkRequired = async <T>(
  name: 'database' | 'redis' | 'mail',
  check: () => Promise<T>
) => {
  try {
    const result = await check()

    log.info({ check: name, result }, 'startup check passed')
  } catch (error) {
    log.error(
      {
        check: name,
        error: error instanceof Error ? error.message : String(error)
      },
      'startup check failed'
    )

    throw error
  }
}

const checkOptional = async <T>(
  name: 'database' | 'redis' | 'mail',
  check: () => Promise<T>
) => {
  try {
    const result = await check()

    log.info({ check: name, result }, 'startup check passed')
  } catch (error) {
    log.warn(
      {
        check: name,
        error: error instanceof Error ? error.message : String(error)
      },
      'optional startup check failed'
    )
  }
}

await checkRequired('database', () => HealthService.checkDatabase())
await checkRequired('redis', () => HealthService.checkRedis())

if (isMailConfigured()) {
  await checkOptional('mail', () => HealthService.checkMail())
} else {
  log.warn({ check: 'mail' }, 'startup check skipped: SMTP config is incomplete')
}

app.listen(port)

const serverUrl = `http://${app.server?.hostname ?? 'localhost'}:${app.server?.port ?? port}`
console.log("Success!!!, Server started at")
console.log(`url: ${serverUrl}`)
