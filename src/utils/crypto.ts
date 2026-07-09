import { createHash } from 'node:crypto'

export const md5 = (value: string) =>
  createHash('md5').update(value).digest('hex')
