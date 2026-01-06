import { IsString, IsNotEmpty, IsObject, IsOptional, IsDateString, IsEnum } from 'class-validator'
import { ApiProvider } from '@tailfire/shared-types'

/**
 * DTO for creating a new API credential
 */
export class CreateCredentialDto {
  @IsEnum(ApiProvider)
  @IsNotEmpty()
  provider!: ApiProvider

  @IsString()
  @IsNotEmpty()
  name!: string

  @IsObject()
  @IsNotEmpty()
  credentials!: Record<string, any> // Will be encrypted before storage

  @IsDateString()
  @IsOptional()
  expiresAt?: string
}
