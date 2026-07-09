import { t } from 'elysia'

import { SmsScene } from '../../enums'
import { UserModel } from '../user/model'

export namespace BaseModel {
  export const captchaQuery = t.Object({
    width: t.Optional(t.Number({ minimum: 1 })),
    height: t.Optional(t.Number({ minimum: 1 })),
    color: t.Optional(t.String({ pattern: '^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$' }))
  })

  export const captchaResponse = t.Object({
    captchaId: t.String(),
    data: t.String(),
    expiresIn: t.Number()
  })

  export const loginBody = t.Object({
    account: t.String({ minLength: 1 }),
    password: t.String({ minLength: 1 }),
    captchaId: t.String({ minLength: 1 }),
    captchaCode: t.String({ minLength: 1 })
  })

  export const loginResponse = t.Object({
    token: t.String()
  })

  export const smsBody = t.Object({
    email: t.String({ format: 'email' }),
    scene: t.Union([t.Literal(SmsScene.regist), t.Literal(SmsScene.reset)])
  })

  export const registerBody = t.Object({
    phone: UserModel.db.insert.phone,
    email: UserModel.db.insert.email,
    password: UserModel.db.insert.password,
    smsCode: t.String({ minLength: 1 })
  })

  export const forgotPasswordBody = t.Object({
    email: UserModel.db.insert.email,
    password: UserModel.db.insert.password,
    smsCode: t.String({ minLength: 1 })
  })

  export const models = {
    BaseCaptchaQuery: captchaQuery,
    BaseCaptchaResponse: captchaResponse,
    BaseLoginBody: loginBody,
    BaseLoginResponse: loginResponse,
    BaseSmsBody: smsBody,
    BaseRegisterBody: registerBody,
    BaseForgotPasswordBody: forgotPasswordBody
  } as const

  export type CaptchaQuery = typeof captchaQuery.static
  export type LoginBody = typeof loginBody.static
  export type SmsBody = typeof smsBody.static
  export type RegisterBody = typeof registerBody.static
  export type ForgotPasswordBody = typeof forgotPasswordBody.static
}
