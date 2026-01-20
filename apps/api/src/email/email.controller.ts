/**
 * Email Controller
 *
 * Endpoints for sending emails and viewing email logs.
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  NotFoundException,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { GetAuthContext } from '../auth/decorators/auth-context.decorator'
import { EmailService } from './email.service'
import { SendEmailDto, EmailLogsFilterDto } from './dto'
import type { AuthContext } from '../auth/auth.types'
import type {
  EmailResult,
  EmailLogResponse,
  PaginatedEmailLogsResponse,
} from '@tailfire/shared-types'

@ApiTags('Emails')
@Controller('emails')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  /**
   * Send an email immediately
   */
  @Post('send')
  @ApiOperation({ summary: 'Send an email' })
  @ApiResponse({ status: 201, description: 'Email sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async sendEmail(
    @GetAuthContext() auth: AuthContext,
    @Body() dto: SendEmailDto
  ): Promise<EmailResult> {
    return this.emailService.sendEmail({
      to: dto.to,
      cc: dto.cc,
      bcc: dto.bcc,
      subject: dto.subject,
      html: dto.html,
      text: dto.text,
      replyTo: dto.replyTo,
      agencyId: auth.agencyId,
      tripId: dto.tripId,
      contactId: dto.contactId,
      activityId: dto.activityId,
      createdBy: auth.userId,
    })
  }

  /**
   * Get email logs with filtering and pagination
   */
  @Get('logs')
  @ApiOperation({ summary: 'List email logs' })
  @ApiResponse({ status: 200, description: 'Email logs retrieved successfully' })
  async getEmailLogs(
    @GetAuthContext() auth: AuthContext,
    @Query() filters: EmailLogsFilterDto
  ): Promise<PaginatedEmailLogsResponse> {
    return this.emailService.getEmailLogs(auth.agencyId, filters)
  }

  /**
   * Get a single email log by ID
   */
  @Get('logs/:id')
  @ApiOperation({ summary: 'Get email log details' })
  @ApiResponse({ status: 200, description: 'Email log retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Email log not found' })
  async getEmailLog(
    @GetAuthContext() auth: AuthContext,
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<EmailLogResponse> {
    const log = await this.emailService.getEmailLog(auth.agencyId, id)
    if (!log) {
      throw new NotFoundException(`Email log ${id} not found`)
    }
    return log
  }
}
