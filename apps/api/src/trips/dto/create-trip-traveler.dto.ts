/**
 * CreateTripTravelerDto with runtime validation
 *
 * Implements discriminated union pattern:
 * - Either contactId (reference to existing contact)
 * - OR contactSnapshot (inline contact data with firstName + lastName required)
 * - CANNOT provide both (enforced by custom validator)
 */

import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
  ValidateIf,
  MinLength,
  MaxLength,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator'
import { Type } from 'class-transformer'

/**
 * Custom validator to ensure mutual exclusion between contactId and contactSnapshot
 */
function IsExclusiveWith(property: string, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isExclusiveWith',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints
          const relatedValue = (args.object as any)[relatedPropertyName]

          // If this field has a value, the other field must NOT have a value
          if (value !== undefined && value !== null) {
            return relatedValue === undefined || relatedValue === null
          }

          // If this field is empty, the other field MUST have a value
          return relatedValue !== undefined && relatedValue !== null
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints
          return `${args.property} and ${relatedPropertyName} are mutually exclusive. Provide exactly one.`
        },
      },
    })
  }
}

/**
 * Contact snapshot for inline traveler creation
 */
export class ContactSnapshotDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName!: string

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName!: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string

  @IsOptional()
  @IsString()
  dateOfBirth?: string

  @IsOptional()
  @IsString()
  @MaxLength(50)
  passportNumber?: string

  @IsOptional()
  @IsString()
  passportExpiry?: string

  @IsOptional()
  @IsString()
  @MaxLength(3)
  nationality?: string
}

/**
 * Emergency contact inline data
 */
export class EmergencyContactInlineDto {
  @IsString()
  @MinLength(1)
  name!: string

  @IsString()
  @MinLength(1)
  phone!: string

  @IsOptional()
  @IsString()
  relationship?: string

  @IsOptional()
  @IsString()
  email?: string
}

/**
 * CreateTripTravelerDto - Discriminated union
 *
 * EITHER:
 * - Provide contactId (existing contact reference)
 * OR:
 * - Provide contactSnapshot (inline contact data)
 *
 * Validation enforces mutual exclusivity:
 * 1. ValidateIf ensures validation only runs when relevant
 * 2. IsExclusiveWith ensures both fields cannot be set simultaneously
 */
export class CreateTripTravelerDto {
  // Option 1: Reference to existing contact
  @ValidateIf((o) => !o.contactSnapshot)
  @IsUUID()
  @IsExclusiveWith('contactSnapshot', {
    message: 'Cannot provide both contactId and contactSnapshot. Provide exactly one.',
  })
  contactId?: string

  // Option 2: Inline contact snapshot
  @ValidateIf((o) => !o.contactId)
  @ValidateNested()
  @Type(() => ContactSnapshotDto)
  @IsExclusiveWith('contactId', {
    message: 'Cannot provide both contactSnapshot and contactId. Provide exactly one.',
  })
  contactSnapshot?: ContactSnapshotDto

  // Traveler info
  @IsOptional()
  @IsIn(['primary_contact', 'full_access', 'limited_access'])
  role?: 'primary_contact' | 'full_access' | 'limited_access'

  @IsOptional()
  @IsBoolean()
  isPrimaryTraveler?: boolean

  @IsOptional()
  @IsIn(['adult', 'child', 'infant'])
  travelerType?: 'adult' | 'child' | 'infant'

  // Emergency contact (flexible - either reference or inline)
  @IsOptional()
  @IsUUID()
  emergencyContactId?: string

  @IsOptional()
  @ValidateNested()
  @Type(() => EmergencyContactInlineDto)
  emergencyContactInline?: EmergencyContactInlineDto

  // Special requirements
  @IsOptional()
  @IsString()
  specialRequirements?: string

  // Ordering
  @IsOptional()
  @IsInt()
  sequenceOrder?: number
}
