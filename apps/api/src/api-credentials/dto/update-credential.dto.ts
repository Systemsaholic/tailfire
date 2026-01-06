import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator'

export enum CredentialStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked'
}

/**
 * DTO for updating API credential metadata
 * Note: Does not allow updating the encrypted credentials themselves.
 * Use rotation endpoint to update credentials.
 */
export class UpdateCredentialDto {
  @IsString()
  @IsOptional()
  name?: string

  @IsEnum(CredentialStatus)
  @IsOptional()
  status?: CredentialStatus

  @IsDateString()
  @IsOptional()
  expiresAt?: string
}
