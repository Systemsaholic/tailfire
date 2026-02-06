/**
 * Update Supplier DTO
 */

import {
  IsString,
  IsOptional,
  IsObject,
  MaxLength,
  MinLength,
  ValidateIf,
  IsBoolean,
  Matches,
} from 'class-validator'
import type { SupplierContactInfo } from '@tailfire/shared-types'

export class UpdateSupplierDto {
  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.name !== undefined)
  @MinLength(1, { message: 'Supplier name cannot be empty' })
  @MaxLength(255)
  name?: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  legalName?: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  supplierType?: string

  @IsOptional()
  @IsObject()
  contactInfo?: SupplierContactInfo

  @IsOptional()
  @IsString()
  @Matches(/^\d{1,3}(\.\d{1,2})?$/, {
    message: 'Commission rate must be a valid percentage (e.g., "10.00")',
  })
  defaultCommissionRate?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @IsBoolean()
  isPreferred?: boolean

  @IsOptional()
  @IsString()
  notes?: string

  @IsOptional()
  @IsString()
  defaultTermsAndConditions?: string

  @IsOptional()
  @IsString()
  defaultCancellationPolicy?: string
}
