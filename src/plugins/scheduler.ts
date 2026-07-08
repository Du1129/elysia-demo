import { cron } from '@elysia/cron'
import { Elysia } from 'elysia'

import { log } from './logger'

const createSchedulerPlugin = () => {
  const app = new Elysia({ name: 'scheduler-plugin' })

  if (Bun.env.CRON_ENABLED !== 'true') return app

  return app.use(
    cron({
      name: 'heartbeat',
      pattern: Bun.env.CRON_HEARTBEAT_PATTERN ?? '0 */5 * * * *',
      run() {
        log.debug('cron heartbeat')
      }
    })
  )
}

export const schedulerPlugin = createSchedulerPlugin()
