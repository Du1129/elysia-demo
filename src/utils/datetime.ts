import dayjs, { type ConfigType } from 'dayjs'

export const DateTimeFormat = {
  date: 'YYYY-MM-DD',
  time: 'HH:mm:ss',
  dateTime: 'YYYY-MM-DD HH:mm:ss',
  dateTimeMinute: 'YYYY-MM-DD HH:mm',
  compactDate: 'YYYYMMDD',
  compactDateTime: 'YYYYMMDDHHmmss',
  isoDateTime: 'YYYY-MM-DDTHH:mm:ssZ'
} as const

export type DateTimeFormatKey = keyof typeof DateTimeFormat

export const formatDateTime = (
  value: ConfigType = new Date(),
  format: string = DateTimeFormat.dateTime
) => dayjs(value).format(format)

export const formatDate = (value: ConfigType = new Date()) =>
  formatDateTime(value, DateTimeFormat.date)

export const formatTime = (value: ConfigType = new Date()) =>
  formatDateTime(value, DateTimeFormat.time)

export const formatCompactDateTime = (value: ConfigType = new Date()) =>
  formatDateTime(value, DateTimeFormat.compactDateTime)

export const toUnixSeconds = (value: ConfigType = new Date()) =>
  dayjs(value).unix()

export const toDate = (value: ConfigType) => dayjs(value).toDate()
