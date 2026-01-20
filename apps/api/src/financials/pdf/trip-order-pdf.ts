/**
 * Trip Order PDF Component
 *
 * Professional Trip Order PDF using @react-pdf/renderer.
 * Uses React.createElement for compatibility with SWC (no JSX).
 */

import * as React from 'react'
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer'
import type { TripOrderPDFProps } from './types'

// Register fonts for Phoenix Voyages branding
Font.register({
  family: 'Lato',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/npm/@fontsource/lato@5.0.0/files/lato-latin-400-normal.woff',
      fontWeight: 400,
    },
    {
      src: 'https://cdn.jsdelivr.net/npm/@fontsource/lato@5.0.0/files/lato-latin-700-normal.woff',
      fontWeight: 700,
    },
  ],
})

// Phoenix Voyages brand colors
const COLORS = {
  primary: '#c59746',
  secondary: '#e89e4a',
  dark: '#1a1a1a',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    900: '#111827',
  },
}

// Create styles
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Lato',
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 40,
    backgroundColor: '#ffffff',
    lineHeight: 1.6,
  },
  headerContainer: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.gray[200],
    paddingBottom: 20,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  companyName: {
    fontWeight: 700,
    fontSize: 18,
    color: COLORS.primary,
    marginBottom: 4,
  },
  companyAddress: {
    fontSize: 9,
    color: COLORS.gray[700],
    marginBottom: 2,
  },
  orderTitle: {
    fontWeight: 700,
    fontSize: 16,
    color: COLORS.dark,
    marginBottom: 4,
    textAlign: 'right',
  },
  orderNumber: {
    fontSize: 12,
    fontWeight: 700,
    color: COLORS.primary,
  },
  orderDate: {
    fontSize: 9,
    color: COLORS.gray[600],
    marginTop: 4,
  },
  sectionTitle: {
    fontWeight: 700,
    fontSize: 12,
    color: COLORS.gray[900],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
    paddingBottom: 4,
    marginBottom: 8,
    marginTop: 12,
  },
  infoBox: {
    backgroundColor: COLORS.gray[50],
    padding: 10,
    borderRadius: 4,
    marginBottom: 8,
  },
  infoLabel: {
    fontWeight: 700,
    fontSize: 9,
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 10,
    color: COLORS.gray[700],
    marginBottom: 2,
  },
  financialBox: {
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: 6,
    padding: 16,
    marginBottom: 16,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  financialLabel: {
    fontSize: 10,
    color: COLORS.gray[600],
  },
  financialAmount: {
    fontSize: 10,
    fontWeight: 700,
    color: COLORS.gray[900],
  },
  financialTotal: {
    fontSize: 14,
    fontWeight: 700,
    color: COLORS.primary,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
    paddingVertical: 6,
  },
  tableCell: {
    fontSize: 9,
    color: COLORS.gray[900],
  },
  tableCellRight: {
    fontSize: 9,
    color: COLORS.gray[900],
    textAlign: 'right',
  },
  footer: {
    fontSize: 8,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
})

// Helper to create elements
const el = React.createElement

export function TripOrderPDF(props: TripOrderPDFProps) {
  const { tripOrder, businessConfig, paymentSummary, bookingDetails, version } = props
  const { order_header, service_details, cost_breakdown, compliance_statement } = tripOrder

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  // Build the document using React.createElement
  return el(
    Document,
    null,
    el(
      Page,
      { size: 'LETTER', style: styles.page },
      // Header Section
      el(
        View,
        { style: styles.headerContainer },
        el(
          View,
          { style: styles.headerRow },
          // Company Info
          el(
            View,
            { style: { flex: 1 } },
            businessConfig.logo_url && el(Image, { src: businessConfig.logo_url, style: { width: 50, height: 50, marginBottom: 8 } }),
            el(Text, { style: styles.companyName }, order_header.agency_info.name),
            el(Text, { style: styles.companyAddress }, order_header.agency_info.address),
            el(Text, { style: styles.companyAddress }, `Tel: ${businessConfig.toll_free || businessConfig.phone || ''}`),
            el(Text, { style: styles.companyAddress }, order_header.agency_info.email)
          ),
          // Order Info
          el(
            View,
            { style: { textAlign: 'right' } },
            el(Text, { style: styles.orderTitle }, 'TRIP ORDER'),
            el(Text, { style: styles.orderNumber }, `Order #: ${order_header.order_number}`),
            el(Text, { style: styles.orderDate }, `Date: ${formatDate(order_header.order_date)}`)
          )
        )
      ),
      // Customer Info
      el(
        View,
        { style: styles.infoBox },
        el(Text, { style: styles.infoLabel }, 'CUSTOMER INFORMATION'),
        el(Text, { style: styles.infoValue }, order_header.customer_info.name),
        order_header.customer_info.email && el(Text, { style: styles.infoValue }, order_header.customer_info.email),
        order_header.customer_info.phone && el(Text, { style: styles.infoValue }, order_header.customer_info.phone)
      ),
      // Service Details
      el(
        View,
        { style: styles.infoBox },
        el(Text, { style: styles.infoLabel }, 'SERVICE DETAILS'),
        el(Text, { style: styles.infoValue }, service_details.description),
        service_details.travel_dates &&
          el(Text, { style: styles.infoValue }, `Travel: ${formatDate(service_details.travel_dates.departure)} - ${formatDate(service_details.travel_dates.return)}`)
      ),
      // Financial Summary
      el(Text, { style: styles.sectionTitle }, 'FINANCIAL SUMMARY'),
      el(
        View,
        { style: styles.financialBox },
        el(
          View,
          { style: styles.financialRow },
          el(Text, { style: styles.financialLabel }, 'Trip Order Amount'),
          el(Text, { style: styles.financialTotal }, formatCurrency(cost_breakdown.final_total))
        ),
        el(
          View,
          { style: styles.financialRow },
          el(Text, { style: styles.financialLabel }, 'Payments Received'),
          el(Text, { style: [styles.financialAmount, { color: '#22c55e' }] }, formatCurrency(paymentSummary?.processed_payments || 0))
        ),
        el(
          View,
          { style: styles.financialRow },
          el(Text, { style: styles.financialLabel }, 'Balance Due'),
          el(
            Text,
            { style: [styles.financialAmount, { color: paymentSummary?.balance_due && paymentSummary.balance_due > 0 ? '#ef4444' : '#22c55e' }] },
            formatCurrency(paymentSummary?.balance_due ?? cost_breakdown.final_total)
          )
        )
      ),
      // Cost Breakdown
      bookingDetails &&
        bookingDetails.length > 0 &&
        el(
          View,
          null,
          el(Text, { style: styles.sectionTitle }, 'COST BREAKDOWN'),
          ...bookingDetails.map((booking, index) =>
            el(
              View,
              { key: booking.booking_id || index, style: styles.tableRow },
              el(View, { style: { flex: 3 } }, el(Text, { style: styles.tableCell }, booking.title)),
              el(View, { style: { flex: 2 } }, el(Text, { style: styles.tableCellRight }, formatCurrency(booking.amount || 0)))
            )
          ),
          el(
            View,
            { style: [styles.tableRow, { borderTopWidth: 2, borderTopColor: COLORS.gray[300] }] },
            el(View, { style: { flex: 3 } }, el(Text, { style: [styles.tableCell, { fontWeight: 700 }] }, 'TOTAL')),
            el(View, { style: { flex: 2 } }, el(Text, { style: [styles.tableCellRight, { fontWeight: 700, color: COLORS.primary }] }, formatCurrency(cost_breakdown.final_total)))
          )
        ),
      // Passengers
      service_details.passengers &&
        service_details.passengers.length > 0 &&
        el(
          View,
          null,
          el(Text, { style: styles.sectionTitle }, 'PASSENGERS'),
          ...service_details.passengers.map((passenger, index) =>
            el(
              View,
              { key: passenger.id || index, style: styles.infoBox },
              el(Text, { style: styles.infoValue }, `${index + 1}. ${passenger.firstName} ${passenger.lastName}`),
              passenger.type && el(Text, { style: { fontSize: 8, color: COLORS.gray[500] } }, passenger.type),
              passenger.dateOfBirth && el(Text, { style: { fontSize: 8, color: COLORS.gray[500] } }, `DOB: ${formatDate(passenger.dateOfBirth)}`)
            )
          )
        ),
      // Disclosures
      el(Text, { style: styles.sectionTitle }, 'IMPORTANT DISCLOSURES'),
      el(
        View,
        { style: styles.infoBox },
        el(Text, { style: { fontSize: 8, color: COLORS.gray[700], lineHeight: 1.4 } }, compliance_statement)
      ),
      // TICO Info
      businessConfig.tico_registration &&
        el(
          View,
          { style: styles.infoBox },
          el(Text, { style: { fontSize: 8, color: COLORS.gray[600] } }, `TICO Registration: ${businessConfig.tico_registration}`)
        ),
      // Footer
      el(
        View,
        { style: styles.footer },
        el(Text, null, `Generated: ${formatDate(order_header.order_date)}`),
        version && el(Text, { style: { fontSize: 7, color: COLORS.gray[500], marginTop: 2 } }, `Version ${version}`),
        el(Text, { style: { marginTop: 4 } }, 'Please retain this document for your records')
      )
    )
  )
}
