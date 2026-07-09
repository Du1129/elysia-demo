import * as svgCaptcha from 'svg-captcha'
import { eq, or } from 'drizzle-orm'

import { db } from '../../db'
import { users } from '../../db/schema'
import { isMailConfigured } from '../../config/mail'
import { SmsScene, SmsSceneText } from '../../enums'
import { getRedis } from '../../lib/redis'
import { sendMail } from '../../lib/mail'
import { serviceError } from '../../model'
import { md5 } from '../../utils/crypto'
import type { BaseModel } from './model'

const captchaExpiresIn = Number(Bun.env.CAPTCHA_EXPIRES_IN ?? 300)
const captchaKeyPrefix = Bun.env.CAPTCHA_KEY_PREFIX ?? 'captcha'
const smsCodeExpiresIn = Number(Bun.env.SMS_CODE_EXPIRES_IN ?? 300)
const smsRateLimitSeconds = Number(Bun.env.SMS_RATE_LIMIT_SECONDS ?? 60)
const smsKeyPrefix = Bun.env.SMS_KEY_PREFIX ?? 'sms'
const defaultCaptchaOptions = {
  width: 120,
  height: 40,
  color: '#333333'
} as const

const captchaKey = (captchaId: string) => `${captchaKeyPrefix}:${captchaId}`
const smsCodeKey = (email: string, scene: string) => `${smsKeyPrefix}:code:${scene}:${email}`
const smsRateKey = (email: string, scene: string) => `${smsKeyPrefix}:rate:${scene}:${email}`
const toSvgDataUrl = (svg: string) =>
  `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
const applyTextColor = (svg: string, color: string | undefined) =>
  color
    ? svg.replace(/<path fill="(?!none")[^"]+" d="/g, `<path fill="${color}" d="`)
    : svg
const randomSmsCode = () =>
  Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0')
const smsSubject = (scene: BaseModel.SmsBody['scene']) =>
  scene === SmsScene.regist ? '注册账号验证码' : '忘记密码验证码'
const smsText = (code: string, scene: BaseModel.SmsBody['scene']) =>
  `你的${SmsSceneText[scene]}验证码是：${code}，${smsCodeExpiresIn} 秒内有效。`
const smsHtml = (code: string, scene: BaseModel.SmsBody['scene']) =>
  `<p>你的${SmsSceneText[scene]}验证码是：<strong>${code}</strong></p><p>验证码 ${smsCodeExpiresIn} 秒内有效。</p>`

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
      return serviceError(400, 'BAD_REQUEST', '验证码错误', 'user')
    }

    const user = await BaseService.findLoginUser(body.account)

    if (!user || !BaseService.verifyPassword(body.password, user.password)) {
      return serviceError(400, 'BAD_REQUEST', '账户或密码错误', 'user')
    }

    if (user.status !== 1) {
      return serviceError(403, 'FORBIDDEN', '该账号已停用', 'user')
    }

    return {
      err: null,
      user
    }
  }

  // 发送邮箱验证码，并用 Redis 限制同一邮箱同一场景一分钟只能发送一次。
  static async sendSms(body: BaseModel.SmsBody) {
    const redis = await getRedis()
    const rateKey = smsRateKey(body.email, body.scene)
    const codeKey = smsCodeKey(body.email, body.scene)
    const rateSet = await redis.set(rateKey, '1', {
      EX: smsRateLimitSeconds,
      NX: true
    })

    if (rateSet !== 'OK') {
      return serviceError(
        429,
        'TOO_MANY_REQUESTS',
        '发送过于频繁，请稍后再试'
      )
    }

    if (!isMailConfigured()) {
      await redis.del(rateKey)

      return serviceError(503, 'INTERNAL_SERVER_ERROR', '邮件服务异常')
    }

    const code = randomSmsCode()

    await redis.setEx(codeKey, smsCodeExpiresIn, code)

    try {
      await sendMail({
        to: body.email,
        subject: smsSubject(body.scene),
        text: smsText(code, body.scene),
        html: smsHtml(code, body.scene)
      })
    } catch {
      await redis.del(rateKey)
      await redis.del(codeKey)

      return serviceError(503, 'INTERNAL_SERVER_ERROR', '邮件发送失败')
    }

    return {
      err: null
    }
  }
}
