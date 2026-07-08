import * as qiniu from 'qiniu'

type QiniuRegion = 'z0' | 'cn-east-2' | 'z1' | 'z2' | 'na0' | 'as0'

const optional = (value: string | undefined) => value?.trim() || undefined
const numberEnv = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : fallback
}

const qiniuZones: Record<QiniuRegion, qiniu.conf.Zone> = {
  z0: qiniu.zone.Zone_z0,
  'cn-east-2': qiniu.zone.Zone_cn_east_2,
  z1: qiniu.zone.Zone_z1,
  z2: qiniu.zone.Zone_z2,
  na0: qiniu.zone.Zone_na0,
  as0: qiniu.zone.Zone_as0
}

const isQiniuRegion = (value: string | undefined): value is QiniuRegion =>
  Boolean(value && value in qiniuZones)

export const qiniuConfig = {
  uploadUrl: optional(Bun.env.QINIU_UPLOAD_URL),
  accessKey: optional(Bun.env.QINIU_ACCESS_KEY),
  secretKey: optional(Bun.env.QINIU_SECRET_KEY),
  bucket: optional(Bun.env.QINIU_BUCKET),
  domain: optional(Bun.env.QINIU_DOMAIN),
  region: optional(Bun.env.QINIU_REGION),
  useHttps: Bun.env.QINIU_USE_HTTPS !== 'false',
  tokenExpires: numberEnv(Bun.env.QINIU_TOKEN_EXPIRES, 3600)
}

const requireQiniuConfig = () => {
  const missing = Object
    .entries(qiniuConfig)
    .filter(([key, value]) => key !== 'domain' && !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    throw new Error(`Missing Qiniu config: ${missing.join(', ')}`)
  }

  return qiniuConfig as typeof qiniuConfig & {
    accessKey: string
    secretKey: string
    bucket: string
  }
}

const normalizeDomain = (domain: string) => {
  if (/^https?:\/\//.test(domain)) return domain

  return `${qiniuConfig.useHttps ? 'https' : 'http'}://${domain}`
}

export const isQiniuConfigured = () => Boolean(
  qiniuConfig.accessKey &&
  qiniuConfig.secretKey &&
  qiniuConfig.bucket
)

export const createQiniuMac = () => {
  const config = requireQiniuConfig()

  return new qiniu.auth.digest.Mac(config.accessKey, config.secretKey)
}

export const createQiniuBucketManager = () => {
  const mac = createQiniuMac()
  const config = new qiniu.conf.Config({
    useHttpsDomain: qiniuConfig.useHttps,
    zone: isQiniuRegion(qiniuConfig.region)
      ? qiniuZones[qiniuConfig.region]
      : undefined
  })

  return new qiniu.rs.BucketManager(mac, config)
}

export const createQiniuUploadToken = (
  key?: string,
  expires = qiniuConfig.tokenExpires
) => {
  const config = requireQiniuConfig()
  const mac = createQiniuMac()
  const scope = key ? `${config.bucket}:${key}` : config.bucket
  const putPolicy = new qiniu.rs.PutPolicy({
    scope,
    expires
  })

  return putPolicy.uploadToken(mac)
}

export const createQiniuPublicUrl = (key: string) => {
  if (!qiniuConfig.domain) {
    throw new Error('Missing Qiniu config: domain')
  }

  return createQiniuBucketManager().publicDownloadUrl(
    normalizeDomain(qiniuConfig.domain),
    key
  )
}
