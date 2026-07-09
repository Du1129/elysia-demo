import nodemailer from 'nodemailer'
import type Mail from 'nodemailer/lib/mailer'

import { isMailConfigured, mailConfig } from '../config/mail'

let transporter: nodemailer.Transporter | null = null

const getTransporter = () => {
  if (!isMailConfigured()) {
    throw new Error('SMTP config is incomplete')
  }

  transporter ??= nodemailer.createTransport({
    host: mailConfig.host,
    port: mailConfig.port,
    secure: mailConfig.secure,
    auth: {
      user: mailConfig.user,
      pass: mailConfig.password
    }
  })

  return transporter
}

export type SendMailInput = Pick<Mail.Options, 'to' | 'subject' | 'text' | 'html'>

export const sendMail = (input: SendMailInput) =>
  getTransporter().sendMail({
    from: mailConfig.from,
    ...input
  })

export const verifyMailConnection = () => getTransporter().verify()
