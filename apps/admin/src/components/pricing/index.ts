/**
 * Pricing components barrel export
 *
 * LAYOUT PATTERN for Booking & Pricing tabs:
 *
 *   <PricingSection />           // Pricing only (invoice type, pricing type, price, taxes, currency)
 *   <PaymentScheduleSection />   // Payment schedule
 *   <BookingDetailsSection />    // Booking details (confirmation, supplier, T&C)
 *   <CommissionSection />        // Commission at bottom (SINGLE source - do NOT add commission to PricingSection)
 *
 * This separation prevents duplicate commission inputs.
 */

export * from './pricing-section'
export * from './commission-section'
export * from './booking-details-section'
export * from './credit-card-authorization-payment-section'
