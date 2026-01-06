import { IsObject, IsNotEmpty, IsOptional, IsDateString } from 'class-validator'

/**
 * DTO for rotating API credentials
 * Creates a new version of the credential with updated secrets
 */
export class RotateCredentialDto {
  @IsObject()
  @IsNotEmpty()
  credentials!: Record<string, any> // New credentials to encrypt

  @IsDateString()
  @IsOptional()
  expiresAt?: string
}
