const optional = (value: string | undefined) => value || undefined

export const mailConfig = {
  host: optional(Bun.env.SMTP_HOST),
  port: Number(Bun.env.SMTP_PORT ?? 465),
  secure: Bun.env.SMTP_SECURE !== 'false',
  user: optional(Bun.env.SMTP_USER),
  password: optional(Bun.env.SMTP_PASSWORD),
  from: optional(Bun.env.SMTP_FROM) ?? optional(Bun.env.SMTP_USER)
}

export const isMailConfigured = () =>
  Boolean(
    mailConfig.host &&
    mailConfig.port &&
    mailConfig.user &&
    mailConfig.password &&
    mailConfig.from
  )
