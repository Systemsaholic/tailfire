/**
 * Trip-Order PDF Generation Service
 *
 * Generates professional Trip-Order documents including:
 * - Trip header with agency branding
 * - Trip summary and dates
 * - Activities with costs
 * - Per-traveller cost breakdown
 * - Payment terms and compliance text
 */

import { Injectable, NotFoundException } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import PDFDocument from 'pdfkit'
import { DatabaseService } from '../db/database.service'
import { FinancialSummaryService } from './financial-summary.service'
import type {
  GenerateTripOrderDto,
  TripOrderResponseDto,
  TripOrderSection,
  TripFinancialSummaryResponseDto,
  TravellerFinancialBreakdownDto,
} from '@tailfire/shared-types'

const DEFAULT_SECTIONS: TripOrderSection[] = [
  'header',
  'summary',
  'activities',
  'traveller_breakdown',
  'payment_terms',
]

// Type definitions
interface TripDetails {
  id: string
  name: string
  status: string
  startDate: string | null
  endDate: string | null
  currency: string | null
  description: string | null
}

interface AgencySettingsData {
  primaryColor: string | null
  complianceDisclaimerText: string | null
  insuranceWaiverText: string | null
}

interface ActivityData {
  id: string
  name: string
  activityType: string
  totalPriceCents: number  // From activity_pricing (authoritative source)
  currency: string
  dayDate: string | null
}

interface CreatePDFData {
  trip: TripDetails
  agencySettings: AgencySettingsData | null
  financialSummary: TripFinancialSummaryResponseDto
  activities: ActivityData[]
  sections: TripOrderSection[]
  headerText?: string
}

@Injectable()
export class TripOrderService {
  constructor(
    private readonly db: DatabaseService,
    private readonly financialSummaryService: FinancialSummaryService
  ) {}

  /**
   * Generate a Trip-Order PDF document
   */
  async generateTripOrder(
    tripId: string,
    agencyId: string,
    dto: GenerateTripOrderDto = {}
  ): Promise<Buffer> {
    const sections = dto.sections ?? DEFAULT_SECTIONS

    // Get trip details
    const trip = await this.getTripDetails(tripId)
    if (!trip) {
      throw new NotFoundException(`Trip ${tripId} not found`)
    }

    // Get agency settings for branding
    const agencySettings = await this.getAgencySettings(agencyId)

    // Get financial summary
    const financialSummary = await this.financialSummaryService.getTripFinancialSummary(tripId)

    // Get activities for the trip (pass tripCurrency for null guard defaults)
    const activities = await this.getActivities(tripId, financialSummary.tripCurrency)

    // Generate PDF
    return this.createPDF({
      trip,
      agencySettings,
      financialSummary,
      activities,
      sections,
      headerText: dto.headerText,
    })
  }

  /**
   * Generate Trip-Order and return URL (placeholder for future Supabase storage)
   */
  async generateTripOrderWithUrl(
    tripId: string,
    agencyId: string,
    dto: GenerateTripOrderDto = {}
  ): Promise<TripOrderResponseDto> {
    const pdfBuffer = await this.generateTripOrder(tripId, agencyId, dto)

    // For now, we'll return a data URL. In production, this would upload to Supabase Storage
    // and return a signed URL
    const base64 = pdfBuffer.toString('base64')
    const dataUrl = `data:application/pdf;base64,${base64}`

    const trip = await this.getTripDetails(tripId)
    const filename = `trip-order-${trip?.name?.replace(/[^a-zA-Z0-9]/g, '-') ?? tripId}.pdf`

    return {
      pdfUrl: dataUrl,
      expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour expiry
      filename,
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private async getTripDetails(tripId: string): Promise<TripDetails | null> {
    const [trip] = await this.db.client
      .select({
        id: this.db.schema.trips.id,
        name: this.db.schema.trips.name,
        status: this.db.schema.trips.status,
        startDate: this.db.schema.trips.startDate,
        endDate: this.db.schema.trips.endDate,
        currency: this.db.schema.trips.currency,
        description: this.db.schema.trips.description,
      })
      .from(this.db.schema.trips)
      .where(eq(this.db.schema.trips.id, tripId))
      .limit(1)

    return trip ?? null
  }

  private async getAgencySettings(agencyId: string): Promise<AgencySettingsData | null> {
    if (!agencyId) return null

    const [settings] = await this.db.client
      .select({
        primaryColor: this.db.schema.agencySettings.primaryColor,
        complianceDisclaimerText: this.db.schema.agencySettings.complianceDisclaimerText,
        insuranceWaiverText: this.db.schema.agencySettings.insuranceWaiverText,
      })
      .from(this.db.schema.agencySettings)
      .where(eq(this.db.schema.agencySettings.agencyId, agencyId))
      .limit(1)

    return settings ?? null
  }

  private async getActivities(tripId: string, tripCurrency: string): Promise<ActivityData[]> {
    // LEFT JOIN with activity_pricing to get authoritative pricing data
    const results = await this.db.client
      .select({
        id: this.db.schema.itineraryActivities.id,
        name: this.db.schema.itineraryActivities.name,
        activityType: this.db.schema.itineraryActivities.activityType,
        // Read from activity_pricing (authoritative source)
        totalPriceCents: this.db.schema.activityPricing.totalPriceCents,
        pricingCurrency: this.db.schema.activityPricing.currency,
        dayDate: this.db.schema.itineraryDays.date,
      })
      .from(this.db.schema.itineraryActivities)
      .leftJoin(
        this.db.schema.activityPricing,
        eq(this.db.schema.activityPricing.activityId, this.db.schema.itineraryActivities.id)
      )
      .innerJoin(
        this.db.schema.itineraryDays,
        eq(this.db.schema.itineraryActivities.itineraryDayId, this.db.schema.itineraryDays.id)
      )
      .innerJoin(
        this.db.schema.itineraries,
        eq(this.db.schema.itineraryDays.itineraryId, this.db.schema.itineraries.id)
      )
      .where(eq(this.db.schema.itineraries.tripId, tripId))

    // Map to ActivityData with null guards
    return results.map((r) => ({
      id: r.id,
      name: r.name,
      activityType: r.activityType,
      totalPriceCents: r.totalPriceCents ?? 0,
      currency: r.pricingCurrency ?? tripCurrency,
      dayDate: r.dayDate,
    }))
  }

  private createPDF(data: CreatePDFData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 })
      const chunks: Buffer[] = []

      doc.on('data', (chunk: Buffer) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      const { trip, agencySettings, financialSummary, activities, sections, headerText } = data
      const primaryColor = agencySettings?.primaryColor ?? '#333333'

      // Header Section
      if (sections.includes('header')) {
        this.renderHeader(doc, headerText ?? 'Trip Order', primaryColor)
      }

      // Summary Section
      if (sections.includes('summary')) {
        this.renderSummary(doc, trip, financialSummary.tripCurrency)
      }

      // Activities Section
      if (sections.includes('activities')) {
        this.renderActivities(doc, activities, financialSummary.tripCurrency)
      }

      // Traveller Breakdown Section
      if (sections.includes('traveller_breakdown')) {
        this.renderTravellerBreakdown(doc, financialSummary.travellerBreakdown, financialSummary.tripCurrency)
      }

      // Payment Terms Section
      if (sections.includes('payment_terms')) {
        this.renderPaymentTerms(doc, financialSummary.grandTotal, financialSummary.tripCurrency)
      }

      // Compliance Section
      if (sections.includes('compliance') && agencySettings?.complianceDisclaimerText) {
        this.renderCompliance(doc, agencySettings.complianceDisclaimerText)
      }

      // Insurance Waiver Section
      if (sections.includes('insurance_waiver') && agencySettings?.insuranceWaiverText) {
        this.renderInsuranceWaiver(doc, agencySettings.insuranceWaiverText)
      }

      doc.end()
    })
  }

  private renderHeader(doc: PDFKit.PDFDocument, title: string, primaryColor: string) {
    doc
      .fillColor(primaryColor)
      .fontSize(24)
      .text(title, { align: 'center' })
      .moveDown(0.5)

    doc
      .strokeColor('#cccccc')
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(doc.page.width - 50, doc.y)
      .stroke()
      .moveDown(1)
  }

  private renderSummary(doc: PDFKit.PDFDocument, trip: TripDetails, currency: string) {
    doc
      .fillColor('#333333')
      .fontSize(16)
      .text('Trip Summary', { underline: true })
      .moveDown(0.5)

    doc.fontSize(11)
    doc.text(`Trip Name: ${trip.name}`)
    if (trip.startDate) {
      doc.text(`Start Date: ${trip.startDate}`)
    }
    if (trip.endDate) {
      doc.text(`End Date: ${trip.endDate}`)
    }
    doc.text(`Currency: ${currency}`)
    if (trip.description) {
      doc.moveDown(0.5)
      doc.text(`Description: ${trip.description}`)
    }
    doc.moveDown(1)
  }

  private renderActivities(doc: PDFKit.PDFDocument, activities: ActivityData[], _currency: string) {
    doc
      .fillColor('#333333')
      .fontSize(16)
      .text('Activities', { underline: true })
      .moveDown(0.5)

    if (activities.length === 0) {
      doc.fontSize(11).text('No activities scheduled.')
      doc.moveDown(1)
      return
    }

    // Table header
    doc.fontSize(10).fillColor('#666666')
    const tableTop = doc.y
    doc.text('Date', 50, tableTop, { width: 80 })
    doc.text('Activity', 130, tableTop, { width: 200 })
    doc.text('Type', 330, tableTop, { width: 80 })
    doc.text('Cost', 420, tableTop, { width: 80, align: 'right' })
    doc.moveDown(0.5)

    // Separator line
    doc
      .strokeColor('#cccccc')
      .lineWidth(0.5)
      .moveTo(50, doc.y)
      .lineTo(doc.page.width - 50, doc.y)
      .stroke()
    doc.moveDown(0.3)

    // Table rows
    doc.fillColor('#333333')
    for (const activity of activities) {
      const rowY = doc.y
      // totalPriceCents is already in cents from activity_pricing
      const costDollars = activity.totalPriceCents / 100
      const costStr = costDollars > 0 ? `${activity.currency} ${costDollars.toFixed(2)}` : '-'

      doc.text(activity.dayDate ?? '-', 50, rowY, { width: 80 })
      doc.text(activity.name, 130, rowY, { width: 200 })
      doc.text(activity.activityType, 330, rowY, { width: 80 })
      doc.text(costStr, 420, rowY, { width: 80, align: 'right' })
      doc.moveDown(0.5)
    }

    doc.moveDown(1)
  }

  private renderTravellerBreakdown(
    doc: PDFKit.PDFDocument,
    breakdown: TravellerFinancialBreakdownDto[],
    currency: string
  ) {
    doc
      .fillColor('#333333')
      .fontSize(16)
      .text('Per-Traveller Cost Breakdown', { underline: true })
      .moveDown(0.5)

    if (breakdown.length === 0) {
      doc.fontSize(11).text('No travellers assigned.')
      doc.moveDown(1)
      return
    }

    for (const traveller of breakdown) {
      const totalAmount = (traveller.totalInTripCurrencyCents / 100).toFixed(2)
      const activityAmount = (traveller.activityCostsInTripCurrencyCents / 100).toFixed(2)
      const feeAmount = (traveller.serviceFeesInTripCurrencyCents / 100).toFixed(2)

      doc.fontSize(12).text(`${traveller.travellerName}${traveller.isPrimary ? ' (Primary)' : ''}`)
      doc.fontSize(10).fillColor('#666666')
      doc.text(`  Activity Costs: ${currency} ${activityAmount}`)
      doc.text(`  Service Fees: ${currency} ${feeAmount}`)
      doc.fillColor('#333333')
      doc.text(`  Total: ${currency} ${totalAmount}`)
      doc.moveDown(0.5)
    }

    doc.moveDown(1)
  }

  private renderPaymentTerms(
    doc: PDFKit.PDFDocument,
    grandTotal: TripFinancialSummaryResponseDto['grandTotal'],
    currency: string
  ) {
    doc
      .fillColor('#333333')
      .fontSize(16)
      .text('Payment Summary', { underline: true })
      .moveDown(0.5)

    const totalCost = (grandTotal.totalCostCents / 100).toFixed(2)
    const collected = (grandTotal.totalCollectedCents / 100).toFixed(2)
    const outstanding = (grandTotal.outstandingCents / 100).toFixed(2)

    doc.fontSize(11)
    doc.text(`Total Trip Cost: ${currency} ${totalCost}`)
    doc.text(`Amount Collected: ${currency} ${collected}`)
    doc
      .fontSize(12)
      .fillColor(grandTotal.outstandingCents > 0 ? '#cc0000' : '#009900')
      .text(`Outstanding Balance: ${currency} ${outstanding}`)
    doc.fillColor('#333333')
    doc.moveDown(1)
  }

  private renderCompliance(doc: PDFKit.PDFDocument, text: string) {
    doc
      .fillColor('#333333')
      .fontSize(14)
      .text('Terms & Conditions', { underline: true })
      .moveDown(0.3)

    doc.fontSize(9).fillColor('#666666').text(text, { align: 'justify' })
    doc.fillColor('#333333').moveDown(1)
  }

  private renderInsuranceWaiver(doc: PDFKit.PDFDocument, text: string) {
    doc
      .fillColor('#333333')
      .fontSize(14)
      .text('Insurance & Liability Waiver', { underline: true })
      .moveDown(0.3)

    doc.fontSize(9).fillColor('#666666').text(text, { align: 'justify' })
    doc.fillColor('#333333').moveDown(1)
  }
}
