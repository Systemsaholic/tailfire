/**
 * UpdateTripTravelerDto with runtime validation
 */

import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  IsObject,
} from 'class-validator'

export class UpdateTripTravelerDto {
  @IsOptional()
  @IsUUID()
  contactId?: string

  @IsOptional()
  @IsIn(['primary_contact', 'full_access', 'limited_access'])
  role?: 'primary_contact' | 'full_access' | 'limited_access'

  @IsOptional()
  @IsBoolean()
  isPrimaryTraveler?: boolean

  @IsOptional()
  @IsIn(['adult', 'child', 'infant'])
  travelerType?: 'adult' | 'child' | 'infant'

  @IsOptional()
  @IsObject()
  contactSnapshot?: Record<string, any>

  @IsOptional()
  @IsUUID()
  emergencyContactId?: string

  @IsOptional()
  @IsObject()
  emergencyContactInline?: Record<string, any>

  @IsOptional()
  @IsString()
  specialRequirements?: string

  @IsOptional()
  @IsInt()
  sequenceOrder?: number
}
