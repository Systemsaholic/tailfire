/**
 * Payment Calculation Utilities
 *
 * Centralized helper functions for payment schedule calculations.
 * Handles deposit calculations, currency formatting, and installment logic.
 */

import type {
  DepositType,
  CreateExpectedPaymentItemDto,
} from '@tailfire/shared-types/api'

// Re-export currency helpers from canonical source
export {
  dollarsToCents,
  centsToDollars,
  formatCurrency,
} from '@/lib/pricing/currency-helpers'

// ============================================================================
// Currency Formatting (additional helpers)
// ============================================================================

/**
 * Parse currency string to cents (integers)
 */
export function parseCurrencyToCents(value: string): number {
  // Remove currency symbols, commas, spaces
  const cleaned = value.replace(/[^0-9.-]/g, '')
  const dollars = parseFloat(cleaned) || 0
  return Math.round(dollars * 100)
}

// ============================================================================
// Deposit Calculations
// ============================================================================

export interface DepositCalculation {
  depositAmountCents: number
  remainingAmountCents: number
  totalAmountCents: number
}

/**
 * Calculate deposit amount and remaining balance
 */
export function calculateDeposit(
  totalPriceCents: number,
  depositType: DepositType,
  depositValue: number // either percentage (0-100) or cents
): DepositCalculation {
  let depositAmountCents: number

  if (depositType === 'percentage') {
    // depositValue is percentage (0-100)
    depositAmountCents = Math.round((totalPriceCents * depositValue) / 100)
  } else {
    // depositValue is fixed amount in cents
    depositAmountCents = depositValue
  }

  // Validate deposit doesn't exceed total
  if (depositAmountCents > totalPriceCents) {
    depositAmountCents = totalPriceCents
  }

  return {
    depositAmountCents,
    remainingAmountCents: totalPriceCents - depositAmountCents,
    totalAmountCents: totalPriceCents,
  }
}

/**
 * Generate expected payment items for deposit schedule
 */
export function generateDepositSchedule(
  totalPriceCents: number,
  depositType: DepositType,
  depositValue: number,
  depositDueDate?: string,
  finalDueDate?: string
): CreateExpectedPaymentItemDto[] {
  const calculation = calculateDeposit(totalPriceCents, depositType, depositValue)

  return [
    {
      paymentName: 'Deposit',
      expectedAmountCents: calculation.depositAmountCents,
      dueDate: depositDueDate || null,
      sequenceOrder: 0,
    },
    {
      paymentName: 'Final Balance',
      expectedAmountCents: calculation.remainingAmountCents,
      dueDate: finalDueDate || null,
      sequenceOrder: 1,
    },
  ]
}

// ============================================================================
// Installment Calculations
// ============================================================================

/**
 * Generate expected payment items for installment schedule
 */
export function generateInstallmentSchedule(
  totalPriceCents: number,
  numberOfInstallments: number,
  startDate?: string
): CreateExpectedPaymentItemDto[] {
  if (numberOfInstallments <= 0) {
    return []
  }

  const baseAmount = Math.floor(totalPriceCents / numberOfInstallments)
  const remainder = totalPriceCents - baseAmount * numberOfInstallments

  const installments: CreateExpectedPaymentItemDto[] = []

  for (let i = 0; i < numberOfInstallments; i++) {
    // Add remainder to last installment
    const amount = i === numberOfInstallments - 1 ? baseAmount + remainder : baseAmount

    // Calculate due date (if startDate provided, increment by months)
    let dueDate: string | null = null
    if (startDate) {
      const date = new Date(startDate)
      date.setMonth(date.getMonth() + i)
      dueDate = date.toISOString().split('T')[0] ?? null
    }

    installments.push({
      paymentName: `Installment ${i + 1}`,
      expectedAmountCents: amount,
      dueDate,
      sequenceOrder: i,
    })
  }

  return installments
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate that expected payment items sum to total price
 */
export function validatePaymentSum(
  expectedItems: CreateExpectedPaymentItemDto[],
  totalPriceCents: number
): { isValid: boolean; difference: number } {
  const sum = expectedItems.reduce((acc, item) => acc + item.expectedAmountCents, 0)
  const difference = totalPriceCents - sum

  return {
    isValid: difference === 0,
    difference,
  }
}

/**
 * Validate deposit percentage is within range
 */
export function validateDepositPercentage(percentage: number): boolean {
  return percentage >= 0 && percentage <= 100
}

/**
 * Validate deposit amount doesn't exceed total
 */
export function validateDepositAmount(depositCents: number, totalCents: number): boolean {
  return depositCents >= 0 && depositCents <= totalCents
}
