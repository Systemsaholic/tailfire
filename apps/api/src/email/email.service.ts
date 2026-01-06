import { Injectable, Logger } from '@nestjs/common'
import { getResendClient } from './resend.client'
import { getPasswordResetTemplate, getWelcomeTemplate, getInviteTemplate } from './templates'

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)
  private readonly fromAddress: string
  private readonly fromName: string

  constructor() {
    this.fromAddress = process.env.EMAIL_FROM_ADDRESS || 'noreply@phoenixvoyages.ca'
    this.fromName = process.env.EMAIL_FROM_NAME || 'Phoenix Voyages'
  }

  async sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
    const html = getPasswordResetTemplate({ resetLink })
    await this.sendEmail({
      to: email,
      subject: 'Reset Your Password',
      html,
    })
    this.logger.log(`Password reset email sent to ${email}`)
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const html = getWelcomeTemplate({ firstName })
    await this.sendEmail({
      to: email,
      subject: 'Welcome to Phoenix Voyages',
      html,
    })
    this.logger.log(`Welcome email sent to ${email}`)
  }

  async sendInviteEmail(
    email: string,
    inviteLink: string,
    firstName: string,
    inviterName?: string,
  ): Promise<void> {
    const html = getInviteTemplate({ inviteLink, firstName, inviterName })
    await this.sendEmail({
      to: email,
      subject: "You're Invited to Phoenix Voyages",
      html,
    })
    this.logger.log('Invite email sent')
    this.logger.debug(`Invite email sent to ${email}`)
  }

  private async sendEmail(params: SendEmailParams): Promise<void> {
    try {
      const resend = getResendClient()
      const result = await resend.emails.send({
        from: `${this.fromName} <${this.fromAddress}>`,
        to: params.to,
        subject: params.subject,
        html: params.html,
      })

      if (result.error) {
        this.logger.error(`Failed to send email to ${params.to}: ${result.error.message}`)
        throw new Error(`Email send failed: ${result.error.message}`)
      }

      this.logger.debug(`Email sent successfully to ${params.to}, id: ${result.data?.id}`)
    } catch (error) {
      this.logger.error(`Email service error: ${error}`)
      throw error
    }
  }
}
