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
const loginError = (
  status: 400 | 401 | 403,
  code: 'BAD_REQUEST' | 'UNAUTHORIZED' | 'FORBIDDEN',
  message: string
) => ({
  err: {
    status,
    code,
    message
  },
  user: null
})

export abstract class BaseService {
  // 生成图形验证码并把答案写入 Redis。
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

  // 校验验证码并立即删除 Redis 中的答案，防止重复使用。
  static async verifyCaptcha(captchaId: string, captchaCode: string) {
    const redis = await getRedis()
    const key = captchaKey(captchaId)
    const captchaText = await redis.get(key)

    await redis.del(key)

    return captchaText === captchaCode.trim().toLowerCase()
  }

  // 按手机号或邮箱查找可登录用户。
  static async findLoginUser(account: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(or(eq(users.phone, account), eq(users.email, account)))
      .limit(1)

    return user
  }

  // 使用 MD5 比对用户输入密码和数据库密码。
  static verifyPassword(inputPassword: string, storedPassword: string) {
    return md5(inputPassword) === storedPassword
  }

  // 执行登录前置校验，返回错误信息或已通过校验的用户。
  static async validateLogin(body: BaseModel.LoginBody) {
    const isCaptchaValid = await BaseService.verifyCaptcha(
      body.captchaId,
      body.captchaCode
    )

    if (!isCaptchaValid) {
      return loginError(400, 'BAD_REQUEST', '验证码错误')
    }

    const user = await BaseService.findLoginUser(body.account)

    if (!user || !BaseService.verifyPassword(body.password, user.password)) {
      return loginError(400, 'BAD_REQUEST', '账户或密码错误')
    }

    if (user.status !== 1) {
      return loginError(403, 'FORBIDDEN', '该账号已停用')
    }

    return {
      err: null,
      user
    }
  }
}
