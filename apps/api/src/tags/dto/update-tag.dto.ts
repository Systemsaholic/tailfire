/**
 * UpdateTagDto with runtime validation
 */

import { IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator'

export class UpdateTagDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string

  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string | null

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Color must be a valid hex color (e.g., #8B5CF6)',
  })
  color?: string | null
}
