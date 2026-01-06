import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { EmailService } from '../email/email.service'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)
  private readonly supabaseAdmin: SupabaseClient

  constructor(
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL')
    const serviceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
    }

    this.supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  async requestPasswordReset(email: string): Promise<void> {
    const adminUrl = this.configService.get<string>('ADMIN_URL') || 'http://localhost:3100'

    try {
      // Use Supabase Admin API to generate recovery link
      const { data, error } = await this.supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: {
          redirectTo: `${adminUrl}/auth/reset-password`,
        },
      })

      if (error) {
        // Log error but don't expose to client (prevents email enumeration)
        this.logger.warn(`Password reset link generation failed for ${email}: ${error.message}`)
        return
      }

      if (!data.properties?.action_link) {
        this.logger.warn(`Password reset: no action link generated for ${email}`)
        return
      }

      // Send email with reset link
      await this.emailService.sendPasswordResetEmail(email, data.properties.action_link)
      this.logger.log(`Password reset email sent to ${email}`)
    } catch (error) {
      // Log error but don't expose to client
      this.logger.error(`Password reset error for ${email}: ${error}`)
    }
  }
}
