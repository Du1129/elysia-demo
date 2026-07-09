import * as svgCaptcha from 'svg-captcha'
import { eq, or, type SQL } from 'drizzle-orm'

import { db } from '../../db'
import { users } from '../../db/schema'
import { isMailConfigured } from '../../config/mail'
import { SmsScene, SmsSceneText } from '../../enums'
import { getRedis } from '../../lib/redis'
import { sendMail } from '../../lib/mail'
import { serviceError } from '../../model'
import { md5 } from '../../utils/crypto'
import type { BaseModel } from './model'

// 验证码和短信的过期时间、限流时间、Redis key 前缀。
const captchaExpiresIn = Number(Bun.env.CAPTCHA_EXPIRES_IN ?? 300)
const captchaKeyPrefix = Bun.env.CAPTCHA_KEY_PREFIX ?? 'captcha'
const smsCodeExpiresIn = Number(Bun.env.SMS_CODE_EXPIRES_IN ?? 300)
const smsRateLimitSeconds = Number(Bun.env.SMS_RATE_LIMIT_SECONDS ?? 60)
const smsKeyPrefix = Bun.env.SMS_KEY_PREFIX ?? 'sms'

// 图形验证码默认渲染参数，query 未传时使用这里的值。
const defaultCaptchaOptions = {
  width: 120,
  height: 40,
  color: '#333333'
} as const

// Redis key 生成函数，保持验证码内容和发送限流的命名一致。
const captchaKey = (captchaId: string) => `${captchaKeyPrefix}:${captchaId}`
const smsCodeKey = (email: string, scene: string) => `${smsKeyPrefix}:code:${scene}:${email}`
const smsRateKey = (email: string, scene: string) => `${smsKeyPrefix}:rate:${scene}:${email}`

// svg-captcha 生成的是原始 SVG，这里统一转成 data URL 并按请求色值替换文字颜色。
const toSvgDataUrl = (svg: string) =>
  `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
const applyTextColor = (svg: string, color: string | undefined) =>
  color
    ? svg.replace(/<path fill="(?!none")[^"]+" d="/g, `<path fill="${color}" d="`)
    : svg

// 邮箱验证码生成和邮件内容模板。
const randomSmsCode = () =>
  Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0')
const smsSubject = (scene: BaseModel.SmsBody['scene']) =>
  scene === SmsScene.regist ? '注册账号验证码' : '忘记密码验证码'
const smsText = (code: string, scene: BaseModel.SmsBody['scene']) =>
  `你的${SmsSceneText[scene]}验证码是：${code}，${smsCodeExpiresIn} 秒内有效。`
const smsHtml = (code: string, scene: BaseModel.SmsBody['scene']) =>
  `<p>你的${SmsSceneText[scene]}验证码是：<strong>${code}</strong></p><p>验证码 ${smsCodeExpiresIn} 秒内有效。</p>`

// 注册用户的默认昵称和数据库结果脱敏。
const registerUserName = () => `用户${Date.now().toString().slice(2)}`
const toPublicUser = ({ password: _password, ...user }: typeof users.$inferSelect) => user

// PostgreSQL 唯一约束冲突，用于手机号或邮箱重复时返回业务错误。
const isUniqueViolation = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code?: unknown }).code === '23505'

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

  // 按账号、手机号或邮箱查找用户。
  static async findUserByAccount(input: {
    account?: string
    phone?: string
    email?: string
  }) {
    const conditions: SQL[] = []

    if (input.account) {
      conditions.push(eq(users.phone, input.account))
      conditions.push(eq(users.email, input.account))
    }

    if (input.phone) conditions.push(eq(users.phone, input.phone))
    if (input.email) conditions.push(eq(users.email, input.email))

    if (conditions.length === 0) return undefined

    const [user] = await db
      .select()
      .from(users)
      .where(or(...conditions))
      .limit(1)

    return user
  }

  // 使用 MD5 比对用户输入密码和数据库密码。
  static verifyPassword(inputPassword: string, storedPassword: string) {
    return md5(inputPassword) === storedPassword
  }

  // 校验邮箱验证码，只有正确时才删除验证码和发送限流锁。
  static async verifySmsCode(
    email: string,
    scene: BaseModel.SmsBody['scene'],
    smsCode: string
  ) {
    const redis = await getRedis()
    const rateKey = smsRateKey(email, scene)
    const codeKey = smsCodeKey(email, scene)
    const storedSmsCode = await redis.get(codeKey)

    if (storedSmsCode !== smsCode.trim()) return false

    await Promise.all([
      redis.del(rateKey),
      redis.del(codeKey)
    ])

    return true
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

    const user = await BaseService.findUserByAccount({
      account: body.account
    })

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

  // 使用邮箱验证码注册用户，并把密码 MD5 后写入数据库。
  static async register(body: BaseModel.RegisterBody) {
    const existingUser = await BaseService.findUserByAccount({
      phone: body.phone,
      email: body.email
    })

    if (existingUser) {
      return serviceError(409, 'CONFLICT', '手机号或邮箱已存在')
    }

    const isSmsCodeValid = await BaseService.verifySmsCode(
      body.email,
      SmsScene.regist,
      body.smsCode
    )

    if (!isSmsCodeValid) {
      return serviceError(400, 'BAD_REQUEST', '邮箱验证码错误')
    }

    try {
      const [user] = await db
        .insert(users)
        .values({
          name: registerUserName(),
          phone: body.phone,
          email: body.email,
          password: md5(body.password)
        })
        .returning()

      return {
        err: null,
        user: toPublicUser(user)
      }
    } catch (error) {
      if (isUniqueViolation(error)) {
        return serviceError(409, 'CONFLICT', '手机号或邮箱已存在')
      }

      throw error
    }
  }

  // 使用忘记密码验证码重置用户密码。
  static async forgotPassword(body: BaseModel.ForgotPasswordBody) {
    const user = await BaseService.findUserByAccount({
      email: body.email
    })

    if (!user) {
      return serviceError(404, 'NOT_FOUND', '用户不存在')
    }

    const isSmsCodeValid = await BaseService.verifySmsCode(
      body.email,
      SmsScene.reset,
      body.smsCode
    )

    if (!isSmsCodeValid) {
      return serviceError(400, 'BAD_REQUEST', '邮箱验证码错误')
    }

    await db
      .update(users)
      .set({
        password: md5(body.password)
      })
      .where(eq(users.id, user.id))

    return {
      err: null
    }
  }
}
