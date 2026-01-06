/**
 * Stripe Invoice Controller
 *
 * REST API endpoints for Stripe invoice and webhook operations.
 *
 * TODO: Add @UseGuards(AuthGuard) for invoice/refund endpoints when auth is implemented
 * TODO: Add tenant scoping to ensure users can only access their own agency's service fees
 * Note: The webhook endpoint must remain public (validated by Stripe signature)
 *
 * Endpoints:
 * - POST /service-fees/:id/invoice - Create and send invoice
 * - POST /service-fees/:id/refund - Process refund
 * - POST /webhooks/stripe - Handle Stripe webhooks (public, signature-verified)
 */

import {
  Controller,
  Post,
  Param,
  Body,
  Headers,
  RawBodyRequest,
  Req,
  BadRequestException,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Request } from 'express'
import { StripeInvoiceService } from './stripe-invoice.service'

@ApiTags('Stripe Invoices')
@Controller()
export class StripeInvoiceController {
  constructor(private readonly stripeInvoiceService: StripeInvoiceService) {}

  /**
   * Create and send a Stripe invoice for a service fee
   * POST /service-fees/:id/invoice
   */
  @Post('service-fees/:id/invoice')
  async createInvoice(
    @Param('id') serviceFeeId: string,
    @Body() dto: { agencyId: string; recipientEmail: string; recipientName: string }
  ): Promise<{ invoiceId: string; hostedInvoiceUrl: string }> {
    return this.stripeInvoiceService.createAndSendInvoice(
      serviceFeeId,
      dto.agencyId,
      dto.recipientEmail,
      dto.recipientName
    )
  }

  /**
   * Process a refund through Stripe
   * POST /service-fees/:id/stripe-refund
   */
  @Post('service-fees/:id/stripe-refund')
  async processRefund(
    @Param('id') serviceFeeId: string,
    @Body() dto: { agencyId: string; amountCents?: number; reason?: string }
  ): Promise<{ refundId: string }> {
    return this.stripeInvoiceService.processStripeRefund(
      serviceFeeId,
      dto.agencyId,
      dto.amountCents ?? 0,
      dto.reason
    )
  }

  /**
   * Handle Stripe webhook events
   * POST /webhooks/stripe
   *
   * This endpoint requires raw body access for signature verification.
   * Configure NestJS to preserve raw body for this route.
   */
  @Post('webhooks/stripe')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
    @Headers('stripe-account') stripeAccount?: string
  ): Promise<{ received: boolean }> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!webhookSecret) {
      throw new BadRequestException('Stripe webhook secret not configured')
    }

    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header')
    }

    const rawBody = req.rawBody
    if (!rawBody) {
      throw new BadRequestException('Raw body not available')
    }

    try {
      const event = this.stripeInvoiceService.constructWebhookEvent(
        rawBody,
        signature,
        webhookSecret
      )

      await this.stripeInvoiceService.processWebhookEvent(event, stripeAccount)

      return { received: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      throw new BadRequestException(`Webhook error: ${message}`)
    }
  }
}
