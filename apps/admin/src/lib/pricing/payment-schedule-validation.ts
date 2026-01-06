/**
 * Payment Schedule Validation Helpers
 *
 * Validation logic for payment schedules that can be reused across forms.
 * Ensures data integrity for deposits, installments, and guarantees.
 */

export type ValidationError = {
  field: string
  message: string
}

export interface PaymentScheduleValidationData {
  scheduleType: 'full' | 'deposit' | 'installments' | 'guarantee'
  totalPriceCents: number

  // Deposit fields
  depositType?: 'percentage' | 'fixed_amount' | null
  depositPercentage?: number | null
  depositAmountCents?: number | null

  // Installment fields
  expectedPaymentItems?: Array<{
    paymentName: string
    expectedAmountCents: number
    dueDate: string | null
  }>

  // Guarantee fields
  cardHolderName?: string
  cardLast4?: string
  authorizationCode?: string
  authorizationAmountCents?: number
}

/**
 * Validate payment schedule configuration
 * Returns array of validation errors (empty if valid)
 */
export function validatePaymentSchedule(
  data: PaymentScheduleValidationData
): ValidationError[] {
  const errors: ValidationError[] = []

  switch (data.scheduleType) {
    case 'deposit':
      validateDeposit(data, errors)
      break

    case 'installments':
      validateInstallments(data, errors)
      break

    case 'guarantee':
      validateGuarantee(data, errors)
      break

    case 'full':
      // No additional validation needed for full payment
      break
  }

  return errors
}

/**
 * Validate deposit configuration
 */
function validateDeposit(
  data: PaymentScheduleValidationData,
  errors: ValidationError[]
): void {
  if (!data.depositType) {
    errors.push({
      field: 'depositType',
      message: 'Deposit type is required when using deposit schedule',
    })
    return
  }

  if (data.depositType === 'percentage') {
    if (
      data.depositPercentage === null ||
      data.depositPercentage === undefined
    ) {
      errors.push({
        field: 'depositPercentage',
        message: 'Deposit percentage is required',
      })
    } else if (data.depositPercentage <= 0 || data.depositPercentage > 100) {
      errors.push({
        field: 'depositPercentage',
        message: 'Deposit percentage must be between 0 and 100',
      })
    }
  } else if (data.depositType === 'fixed_amount') {
    if (
      data.depositAmountCents === null ||
      data.depositAmountCents === undefined
    ) {
      errors.push({
        field: 'depositAmountCents',
        message: 'Deposit amount is required',
      })
    } else if (data.depositAmountCents <= 0) {
      errors.push({
        field: 'depositAmountCents',
        message: 'Deposit amount must be greater than 0',
      })
    } else if (data.depositAmountCents > data.totalPriceCents) {
      errors.push({
        field: 'depositAmountCents',
        message: 'Deposit amount cannot exceed total price',
      })
    }
  }
}

/**
 * Validate installment configuration
 */
function validateInstallments(
  data: PaymentScheduleValidationData,
  errors: ValidationError[]
): void {
  if (!data.expectedPaymentItems || data.expectedPaymentItems.length === 0) {
    errors.push({
      field: 'expectedPaymentItems',
      message: 'At least one payment item is required for installment schedule',
    })
    return
  }

  // Validate each payment item
  data.expectedPaymentItems.forEach((item, index) => {
    if (!item.paymentName || item.paymentName.trim() === '') {
      errors.push({
        field: `expectedPaymentItems.${index}.paymentName`,
        message: `Payment #${index + 1} name is required`,
      })
    }

    if (item.expectedAmountCents <= 0) {
      errors.push({
        field: `expectedPaymentItems.${index}.expectedAmountCents`,
        message: `Payment #${index + 1} amount must be greater than 0`,
      })
    }
  })

  // Validate sum of installments matches total (with small tolerance for rounding)
  const installmentsTotal = data.expectedPaymentItems.reduce(
    (sum, item) => sum + item.expectedAmountCents,
    0
  )

  const tolerance = 1 // 1 cent tolerance for rounding errors
  if (Math.abs(installmentsTotal - data.totalPriceCents) > tolerance) {
    errors.push({
      field: 'expectedPaymentItems',
      message: `Sum of installments ($${(installmentsTotal / 100).toFixed(2)}) must equal total price ($${(data.totalPriceCents / 100).toFixed(2)})`,
    })
  }
}

/**
 * Validate credit card guarantee configuration
 */
function validateGuarantee(
  data: PaymentScheduleValidationData,
  errors: ValidationError[]
): void {
  if (!data.cardHolderName || data.cardHolderName.trim() === '') {
    errors.push({
      field: 'cardHolderName',
      message: 'Card holder name is required for credit card authorization',
    })
  }

  if (!data.cardLast4 || data.cardLast4.trim() === '') {
    errors.push({
      field: 'cardLast4',
      message: 'Last 4 digits of card are required',
    })
  } else if (!/^\d{4}$/.test(data.cardLast4)) {
    errors.push({
      field: 'cardLast4',
      message: 'Last 4 digits must be exactly 4 numeric digits',
    })
  }

  if (!data.authorizationCode || data.authorizationCode.trim() === '') {
    errors.push({
      field: 'authorizationCode',
      message: 'Authorization code is required',
    })
  }

  if (
    data.authorizationAmountCents === null ||
    data.authorizationAmountCents === undefined ||
    data.authorizationAmountCents <= 0
  ) {
    errors.push({
      field: 'authorizationAmountCents',
      message: 'Authorization amount is required and must be greater than 0',
    })
  }
}

/**
 * Check if payment schedule has any validation errors
 */
export function hasPaymentScheduleErrors(
  data: PaymentScheduleValidationData
): boolean {
  return validatePaymentSchedule(data).length > 0
}

/**
 * Get validation errors as a keyed object for easy lookup
 */
export function getPaymentScheduleErrorsMap(
  data: PaymentScheduleValidationData
): Record<string, string> {
  const errors = validatePaymentSchedule(data)
  const errorMap: Record<string, string> = {}

  errors.forEach((error) => {
    errorMap[error.field] = error.message
  })

  return errorMap
}
