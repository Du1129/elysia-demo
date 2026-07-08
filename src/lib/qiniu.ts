import * as qiniu from 'qiniu'

const qiniuConfig = {
  accessKey: Bun.env.QINIU_ACCESS_KEY,
  secretKey: Bun.env.QINIU_SECRET_KEY,
  bucket: Bun.env.QINIU_BUCKET,
  domain: Bun.env.QINIU_DOMAIN
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
  const config = new qiniu.conf.Config()

  return new qiniu.rs.BucketManager(mac, config)
}

export const createQiniuUploadToken = (key?: string, expires = 3600) => {
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

  return createQiniuBucketManager().publicDownloadUrl(qiniuConfig.domain, key)
}
