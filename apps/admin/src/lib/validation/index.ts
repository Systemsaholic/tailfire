/**
 * Form Validation Exports
 *
 * Re-exports all validation schemas, types, and utilities.
 */

// Types
export * from './types'

// Utilities
export * from './utils'

// Lodging validation
export {
  lodgingFormSchema,
  lodgingDetailsSchema,
  toLodgingDefaults,
  toApiPayload,
  LODGING_FORM_FIELDS,
  type LodgingFormData,
  type LodgingDetailsData,
} from './lodging-validation'

// Options validation
export {
  optionsFormSchema,
  optionsDetailsSchema,
  toOptionsDefaults,
  toOptionsApiPayload,
  OPTIONS_FORM_FIELDS,
  type OptionsFormData,
  type OptionsDetailsData,
} from './options-validation'

// Dining validation
export {
  diningFormSchema,
  diningDetailsSchema,
  toDiningDefaults,
  toDiningApiPayload,
  DINING_FORM_FIELDS,
  type DiningFormData,
  type DiningDetailsData,
} from './dining-validation'

// Port Info validation
export {
  portInfoFormSchema,
  portInfoDetailsSchema,
  toPortInfoDefaults,
  toPortInfoApiPayload,
  PORT_INFO_FORM_FIELDS,
  type PortInfoFormData,
  type PortInfoDetailsData,
} from './port-info-validation'

// Activity validation
export {
  activityFormSchema,
  toActivityDefaults,
  toActivityApiPayload,
  ACTIVITY_FORM_FIELDS,
  type ActivityFormData,
} from './activity-validation'

// Trip validation
export {
  tripFormSchema,
  toTripDefaults,
  toTripApiPayload,
  TRIP_FORM_FIELDS,
  type TripFormValues,
} from './trip-validation'

// Package validation
export {
  packageFormSchema,
  toPackageDefaults,
  toPackageApiPayload,
  toPackageUpdatePayload,
  buildPackagePricingData,
  PACKAGE_FORM_FIELDS,
  type PackageFormData,
} from './package-validation'
