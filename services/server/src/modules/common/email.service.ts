import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as nodemailer from 'nodemailer'

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT'),
      secure: this.configService.get<boolean>('EMAIL_SECURE', false),
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS')
      }
    })
  }

  async sendMail(options: { to: string | string[]; subject: string; text?: string; html?: string }): Promise<void> {
    const { to, subject, text, html } = options

    await this.transporter.sendMail({
      from: this.configService.get<string>('EMAIL_FROM'),
      to,
      subject,
      text,
      html
    })
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const resetUrl = `${this.configService.get<string>('FRONTEND_URL')}/reset-password?token=${token}`

    await this.sendMail({
      to,
      subject: 'Password Reset Request',
      html: `
                <h3>Password Reset</h3>
                <p>You requested a password reset. Click the link below to reset your password:</p>
                <p><a href="${resetUrl}">Reset Password</a></p>
                <p>If you didn't request this, please ignore this email.</p>
            `
    })
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    await this.sendMail({
      to,
      subject: 'Welcome to our platform!',
      html: `
                <h3>Welcome, ${name}!</h3>
                <p>Thank you for joining our platform. We're excited to have you onboard!</p>
                <p>If you have any questions, feel free to reach out to our support team.</p>
            `
    })
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const verifyUrl = `${this.configService.get<string>('FRONTEND_URL')}/verify-email?token=${token}`

    await this.sendMail({
      to,
      subject: 'Please verify your email address',
      html: `
                <h3>Email Verification</h3>
                <p>Please verify your email address by clicking the link below:</p>
                <p><a href="${verifyUrl}">Verify Email</a></p>
                <p>If you didn't create an account, please ignore this email.</p>
            `
    })
  }
}
