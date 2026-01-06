import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { Throttle, ThrottlerGuard } from '@nestjs/throttler'
import { AuthService } from './auth.service'
import { RequestPasswordResetDto } from './dto'
import { Public } from './decorators/public.decorator'

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Request password reset email
   * POST /auth/request-password-reset
   *
   * CRITICAL: @Public() required - global JWT guard will block otherwise
   * NOTE: @UseGuards(ThrottlerGuard) required - ThrottlerModule exists but no global guard
   */
  @Public()
  @Post('request-password-reset')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Rate limit: 5 requests/min
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent if account exists',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  async requestPasswordReset(
    @Body() dto: RequestPasswordResetDto,
  ): Promise<{ message: string }> {
    await this.authService.requestPasswordReset(dto.email)
    // Always return success to prevent email enumeration
    return { message: 'If an account exists, a reset email has been sent.' }
  }
}
