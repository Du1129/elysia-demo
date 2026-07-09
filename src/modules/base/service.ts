import * as svgCaptcha from 'svg-captcha'
import { eq, or } from 'drizzle-orm'

import { db } from '../../db'
import { users } from '../../db/schema'
import { getRedis } from '../../lib/redis'
import { md5 } from '../../utils/crypto'
import type { BaseModel } from './model'

const captchaExpiresIn = Number(Bun.env.CAPTCHA_EXPIRES_IN ?? 300)
const captchaKeyPrefix = Bun.env.CAPTCHA_KEY_PREFIX ?? 'captcha'
const defaultCaptchaOptions = {
  width: 120,
  height: 40,
  color: '#333333'
} as const

const captchaKey = (captchaId: string) => `${captchaKeyPrefix}:${captchaId}`
const toSvgDataUrl = (svg: string) =>
  `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
const applyTextColor = (svg: string, color: string | undefined) =>
  color
    ? svg.replace(/<path fill="(?!none")[^"]+" d="/g, `<path fill="${color}" d="`)
    : svg

export abstract class BaseService {
  static async createCaptcha(query: BaseModel.CaptchaQuery) {
    const options = {
      width: query.width ?? defaultCaptchaOptions.width,
      height: query.height ?? defaultCaptchaOptions.height,
      color: query.color ?? defaultCaptchaOptions.color
    }

    const captcha = svgCaptcha.create({
      size: 4,
      noise: 2,
      width: options.width,
      height: options.height,
      color: true,
      background: '#f7f8fa',
      ignoreChars: '0oO1ilI'
    })

    const captchaId = crypto.randomUUID()
    const redis = await getRedis()

    await redis.setEx(
      captchaKey(captchaId),
      captchaExpiresIn,
      captcha.text.toLowerCase()
    )

    return {
      captchaId,
      data: toSvgDataUrl(applyTextColor(captcha.data, options.color)),
      expiresIn: captchaExpiresIn
    }
  }

  static async verifyCaptcha(captchaId: string, captchaCode: string) {
    const redis = await getRedis()
    const key = captchaKey(captchaId)
    const captchaText = await redis.get(key)

    await redis.del(key)

    return captchaText === captchaCode.trim().toLowerCase()
  }

  static async findLoginUser(account: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(or(eq(users.phone, account), eq(users.email, account)))
      .limit(1)

    return user
  }

  static verifyPassword(inputPassword: string, storedPassword: string) {
    return md5(inputPassword) === storedPassword
  }

  static async validateLogin(body: BaseModel.LoginBody) {
    const isCaptchaValid = await BaseService.verifyCaptcha(
      body.captchaId,
      body.captchaCode
    )

    if (!isCaptchaValid) {
      return {
        ok: false as const,
        status: 400 as const,
        code: 'BAD_REQUEST' as const,
        message: 'Invalid captcha'
      }
    }

    const user = await BaseService.findLoginUser(body.account)

    if (!user || !BaseService.verifyPassword(body.password, user.password)) {
      return {
        ok: false as const,
        status: 401 as const,
        code: 'UNAUTHORIZED' as const,
        message: 'Invalid account or password'
      }
    }

    if (user.status !== 1) {
      return {
        ok: false as const,
        status: 403 as const,
        code: 'FORBIDDEN' as const,
        message: 'Account is disabled'
      }
    }

    return {
      ok: true as const,
      user
    }
  }
}
