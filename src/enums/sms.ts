export const SmsScene = {
  regist: 'regist',
  reset: 'reset'
} as const

export type SmsScene = (typeof SmsScene)[keyof typeof SmsScene]

export const SmsSceneText: Record<SmsScene, string> = {
  [SmsScene.regist]: '注册账号',
  [SmsScene.reset]: '忘记密码'
}
