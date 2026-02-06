/**
 * List Suppliers Query DTO
 */

import { IsString, IsOptional, IsInt, Min, Max, IsBoolean } from 'class-validator'
import { Type, Transform } from 'class-transformer'

export class ListSuppliersDto {
  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @IsString()
  supplierType?: string

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : value === 'true' || value === true))
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50
}
