/**
 * Stripe Invoice Service
 *
 * Manages Stripe invoice operations:
 * - Creating invoices on connected accounts
 * - Processing webhook events
 * - Handling refunds
 */

import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import Stripe from 'stripe'
import { DatabaseService } from '../db/database.service'
import { StripeConnectService } from './stripe-connect.service'
import { TripNotificationsService } from './trip-notifications.service'
import type { ServiceFeeStatus } from '@tailfire/shared-types'

@Injectable()
export class StripeInvoiceService {
  private stripe: Stripe | null = null
  private readonly logger = new Logger(StripeInvoiceService.name)

  constructor(
    private readonly db: DatabaseService,
    private readonly stripeConnectService: StripeConnectService,
    private readonly notificationsService: TripNotificationsService
  ) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (stripeSecretKey) {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-12-15.clover',
      })
    }
  }

  /**
   * Check if Stripe is configured and available
   */
  private ensureStripeConfigured(): Stripe {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured')
    }
    return this.stripe
  }

  /**
   * Create and send a Stripe invoice for a service fee
   */
  async createAndSendInvoice(
    serviceFeeId: string,
    agencyId: string,
    recipientEmail: string,
    recipientName: string
  ): Promise<{ invoiceId: string; hostedInvoiceUrl: string }> {
    const stripe = this.ensureStripeConfigured()

    // Get service fee
    const [serviceFee] = await this.db.client
      .select()
      .from(this.db.schema.serviceFees)
      .where(eq(this.db.schema.serviceFees.id, serviceFeeId))
      .limit(1)

    if (!serviceFee) {
      throw new NotFoundException(`Service fee ${serviceFeeId} not found`)
    }

    if (serviceFee.status !== 'draft') {
      throw new BadRequestException('Can only create invoices for draft service fees')
    }

    // Get agency settings for Stripe account
    const agencySettings = await this.stripeConnectService.getAgencySettings(agencyId)
    if (!agencySettings.stripeAccountId) {
      throw new BadRequestException('Agency has not connected Stripe')
    }

    if (!agencySettings.stripeChargesEnabled) {
      throw new BadRequestException('Stripe charges are not enabled for this agency')
    }

    // Get trip for contact info
    const [trip] = await this.db.client
      .select()
      .from(this.db.schema.trips)
      .where(eq(this.db.schema.trips.id, serviceFee.tripId))
      .limit(1)

    if (!trip) {
      throw new NotFoundException(`Trip ${serviceFee.tripId} not found`)
    }

    // Get or create Stripe customer
    const customerId = await this.stripeConnectService.getOrCreateCustomer(
      trip.primaryContactId ?? serviceFee.tripId, // Use client contact if available
      agencySettings.stripeAccountId,
      recipientEmail,
      recipientName
    )

    // Create invoice on connected account
    const invoice = await stripe.invoices.create(
      {
        customer: customerId,
        collection_method: 'send_invoice',
        days_until_due: serviceFee.dueDate
          ? Math.max(1, Math.ceil((new Date(serviceFee.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
          : 30,
        metadata: {
          serviceFeeId: serviceFee.id,
          tripId: serviceFee.tripId,
        },
      },
      { stripeAccount: agencySettings.stripeAccountId }
    )

    // Add line item
    await stripe.invoiceItems.create(
      {
        customer: customerId,
        invoice: invoice.id,
        amount: serviceFee.amountCents,
        currency: (serviceFee.currency ?? 'cad').toLowerCase(),
        description: serviceFee.title,
      },
      { stripeAccount: agencySettings.stripeAccountId }
    )

    // Finalize and send the invoice
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(
      invoice.id,
      { stripeAccount: agencySettings.stripeAccountId }
    )

    await stripe.invoices.sendInvoice(invoice.id, {
      stripeAccount: agencySettings.stripeAccountId,
    })

    // Update service fee with Stripe info
    await this.db.client
      .update(this.db.schema.serviceFees)
      .set({
        status: 'sent',
        stripeInvoiceId: invoice.id,
        stripeHostedInvoiceUrl: finalizedInvoice.hosted_invoice_url,
        sentAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(this.db.schema.serviceFees.id, serviceFeeId))

    return {
      invoiceId: invoice.id,
      hostedInvoiceUrl: finalizedInvoice.hosted_invoice_url ?? '',
    }
  }

  /**
   * Process a refund through Stripe
   */
  async processStripeRefund(
    serviceFeeId: string,
    agencyId: string,
    amountCents: number,
    reason?: string
  ): Promise<{ refundId: string }> {
    const stripe = this.ensureStripeConfigured()

    // Get service fee
    const [serviceFee] = await this.db.client
      .select()
      .from(this.db.schema.serviceFees)
      .where(eq(this.db.schema.serviceFees.id, serviceFeeId))
      .limit(1)

    if (!serviceFee) {
      throw new NotFoundException(`Service fee ${serviceFeeId} not found`)
    }

    if (serviceFee.status !== 'paid' && serviceFee.status !== 'partially_refunded') {
      throw new BadRequestException('Can only refund paid or partially refunded service fees')
    }

    if (!serviceFee.stripePaymentIntentId) {
      throw new BadRequestException('No Stripe payment found for this service fee')
    }

    // Get agency settings
    const agencySettings = await this.stripeConnectService.getAgencySettings(agencyId)
    if (!agencySettings.stripeAccountId) {
      throw new BadRequestException('Agency has not connected Stripe')
    }

    // Calculate max refundable
    const currentRefunded = serviceFee.refundedAmountCents ?? 0
    const maxRefundable = serviceFee.amountCents - currentRefunded

    const refundAmount = amountCents || maxRefundable
    if (refundAmount > maxRefundable) {
      throw new BadRequestException(
        `Refund amount exceeds remaining balance. Max refundable: ${maxRefundable} cents`
      )
    }

    // Create refund on connected account
    const refund = await stripe.refunds.create(
      {
        payment_intent: serviceFee.stripePaymentIntentId,
        amount: refundAmount,
        reason: 'requested_by_customer',
        metadata: {
          serviceFeeId: serviceFee.id,
          reason: reason ?? '',
        },
      },
      { stripeAccount: agencySettings.stripeAccountId }
    )

    // Update service fee
    const newTotalRefunded = currentRefunded + refundAmount
    const isFullyRefunded = newTotalRefunded >= serviceFee.amountCents
    const newStatus: ServiceFeeStatus = isFullyRefunded ? 'refunded' : 'partially_refunded'

    await this.db.client
      .update(this.db.schema.serviceFees)
      .set({
        status: newStatus,
        refundedAmountCents: newTotalRefunded,
        refundReason: reason ?? serviceFee.refundReason,
        refundedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(this.db.schema.serviceFees.id, serviceFeeId))

    // Create notification
    await this.notificationsService.createRefundProcessedNotification(
      serviceFee.tripId,
      serviceFeeId,
      refundAmount,
      serviceFee.currency ?? 'CAD'
    )

    return { refundId: refund.id }
  }

  /**
   * Process incoming Stripe webhook event
   */
  async processWebhookEvent(event: Stripe.Event, stripeAccountId?: string): Promise<void> {
    // Check if we've already processed this event
    const [existing] = await this.db.client
      .select()
      .from(this.db.schema.stripeWebhookEvents)
      .where(eq(this.db.schema.stripeWebhookEvents.eventId, event.id))
      .limit(1)

    if (existing) {
      this.logger.log(`Webhook event ${event.id} already processed, skipping`)
      return
    }

    // Record the event
    await this.db.client.insert(this.db.schema.stripeWebhookEvents).values({
      eventId: event.id,
      eventType: event.type,
      stripeAccountId: stripeAccountId ?? null,
      payload: event as unknown as Record<string, unknown>,
    })

    // Process based on event type
    switch (event.type) {
      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice)
        break
      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break
      case 'charge.refunded':
        await this.handleChargeRefunded(event.data.object as Stripe.Charge)
        break
      default:
        this.logger.log(`Unhandled webhook event type: ${event.type}`)
    }
  }

  /**
   * Construct webhook event from raw body
   */
  constructWebhookEvent(
    rawBody: string | Buffer,
    signature: string,
    webhookSecret: string
  ): Stripe.Event {
    const stripe = this.ensureStripeConfigured()
    return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    const serviceFeeId = invoice.metadata?.serviceFeeId
    if (!serviceFeeId) {
      this.logger.log('Invoice paid but no serviceFeeId in metadata')
      return
    }

    // Extract payment intent ID from invoice (may be string or object depending on expansion)
    const invoiceData = invoice as unknown as { payment_intent?: string | { id: string } }
    const paymentIntentId = typeof invoiceData.payment_intent === 'string'
      ? invoiceData.payment_intent
      : invoiceData.payment_intent?.id ?? null

    // Update service fee
    await this.db.client
      .update(this.db.schema.serviceFees)
      .set({
        status: 'paid',
        stripePaymentIntentId: paymentIntentId,
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(this.db.schema.serviceFees.id, serviceFeeId))

    // Get service fee for notification
    const [serviceFee] = await this.db.client
      .select()
      .from(this.db.schema.serviceFees)
      .where(eq(this.db.schema.serviceFees.id, serviceFeeId))
      .limit(1)

    if (serviceFee) {
      await this.notificationsService.createPaymentReceivedNotification(
        serviceFee.tripId,
        serviceFeeId,
        serviceFee.amountCents,
        serviceFee.currency ?? 'CAD'
      )
    }
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const serviceFeeId = invoice.metadata?.serviceFeeId
    if (!serviceFeeId) {
      this.logger.log('Invoice payment failed but no serviceFeeId in metadata')
      return
    }

    // Get service fee for notification
    const [serviceFee] = await this.db.client
      .select()
      .from(this.db.schema.serviceFees)
      .where(eq(this.db.schema.serviceFees.id, serviceFeeId))
      .limit(1)

    if (serviceFee) {
      await this.notificationsService.createPaymentOverdueNotification(
        serviceFee.tripId,
        serviceFeeId,
        serviceFee.amountCents,
        serviceFee.currency ?? 'CAD',
        1 // Days past due
      )
    }
  }

  private async handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
    const serviceFeeId = charge.metadata?.serviceFeeId
    if (!serviceFeeId) {
      // Try to find by payment intent
      if (typeof charge.payment_intent === 'string') {
        const [serviceFee] = await this.db.client
          .select()
          .from(this.db.schema.serviceFees)
          .where(eq(this.db.schema.serviceFees.stripePaymentIntentId, charge.payment_intent))
          .limit(1)

        if (serviceFee) {
          const refundedAmount = charge.amount_refunded
          const currentRefunded = serviceFee.refundedAmountCents ?? 0
          const newTotalRefunded = Math.max(currentRefunded, refundedAmount)
          const isFullyRefunded = newTotalRefunded >= serviceFee.amountCents
          const newStatus: ServiceFeeStatus = isFullyRefunded ? 'refunded' : 'partially_refunded'

          await this.db.client
            .update(this.db.schema.serviceFees)
            .set({
              status: newStatus,
              refundedAmountCents: newTotalRefunded,
              refundedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(this.db.schema.serviceFees.id, serviceFee.id))
        }
      }
    }
  }
}
