/**
 * Create Contact DTO with runtime validation
 *
 * Phase 1: Identity & Inclusive Fields
 * Phase 2: Lifecycle & Status
 * Phase 3: Marketing Compliance
 * Phase 4: Travel Credentials
 */

import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  IsDateString,
  IsBoolean,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator'
import { Type } from 'class-transformer'
import { IsTimezone } from '../../common/validators/is-timezone.validator'

export class CreateContactDto {
  // ============================================================================
  // Name Fields (at least one required via database constraint)
  // ============================================================================

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName?: string

  @IsOptional()
  @IsString()
  legalFirstName?: string

  @IsOptional()
  @IsString()
  legalLastName?: string

  @IsOptional()
  @IsString()
  middleName?: string

  @IsOptional()
  @IsString()
  preferredName?: string

  @IsOptional()
  @IsString()
  @MaxLength(10)
  prefix?: string

  @IsOptional()
  @IsString()
  @MaxLength(10)
  suffix?: string

  // ============================================================================
  // Phase 1: LGBTQ+ Inclusive Fields
  // ============================================================================

  @IsOptional()
  @IsString()
  @MaxLength(50)
  gender?: string

  @IsOptional()
  @IsString()
  @MaxLength(50)
  pronouns?: string

  @IsOptional()
  @IsString()
  @MaxLength(50)
  maritalStatus?: string

  // ============================================================================
  // Contact Information
  // ============================================================================

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string

  // ============================================================================
  // Passport Information
  // ============================================================================

  @IsOptional()
  @IsString()
  @MaxLength(50)
  passportNumber?: string

  @IsOptional()
  @IsDateString()
  passportExpiry?: string

  @IsOptional()
  @IsString()
  @MaxLength(3)
  passportCountry?: string

  @IsOptional()
  @IsDateString()
  passportIssueDate?: string

  @IsOptional()
  @IsString()
  @MaxLength(3)
  nationality?: string

  // ============================================================================
  // Phase 4: TSA Credentials
  // ============================================================================

  @IsOptional()
  @IsString()
  @MaxLength(20)
  redressNumber?: string

  @IsOptional()
  @IsString()
  @MaxLength(20)
  knownTravelerNumber?: string

  // ============================================================================
  // Address
  // ============================================================================

  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine1?: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine2?: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  province?: string

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string

  @IsOptional()
  @IsString()
  @MaxLength(3)
  country?: string

  // ============================================================================
  // Requirements
  // ============================================================================

  @IsOptional()
  @IsString()
  dietaryRequirements?: string

  @IsOptional()
  @IsString()
  mobilityRequirements?: string

  // ============================================================================
  // Phase 4: Travel Preferences
  // ============================================================================

  @IsOptional()
  @IsString()
  @MaxLength(20)
  seatPreference?: string

  @IsOptional()
  @IsString()
  @MaxLength(20)
  cabinPreference?: string

  @IsOptional()
  @IsString()
  @MaxLength(20)
  floorPreference?: string

  @IsOptional()
  @IsString()
  travelPreferences?: string

  // ============================================================================
  // Phase 2: Lifecycle (optional on create)
  // ============================================================================

  @IsOptional()
  @IsEnum(['lead', 'client'])
  contactType?: 'lead' | 'client'

  @IsOptional()
  @IsEnum(['prospecting', 'quoted', 'booked', 'traveling', 'returned', 'awaiting_next', 'inactive'])
  contactStatus?: 'prospecting' | 'quoted' | 'booked' | 'traveling' | 'returned' | 'awaiting_next' | 'inactive'

  // ============================================================================
  // Phase 3: Marketing Consent (optional on create)
  // ============================================================================

  @IsOptional()
  @IsBoolean()
  marketingEmailOptIn?: boolean

  @IsOptional()
  @IsBoolean()
  marketingSmsOptIn?: boolean

  @IsOptional()
  @IsBoolean()
  marketingPhoneOptIn?: boolean

  @IsOptional()
  @IsString()
  marketingOptInSource?: string

  // ============================================================================
  // Metadata
  // ============================================================================

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  tags?: string[]

  // ============================================================================
  // Phase 3.5: Date/Time Management
  // ============================================================================

  @IsOptional()
  @IsTimezone()
  timezone?: string

  // ============================================================================
  // Ownership (Auth Phase 1)
  // ============================================================================

  @IsOptional()
  @IsString()
  ownerId?: string // NULL = agency-wide contact, non-NULL = user-owned
}
