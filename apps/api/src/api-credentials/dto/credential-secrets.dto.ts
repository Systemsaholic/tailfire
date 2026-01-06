import { CredentialMetadataDto } from './credential-metadata.dto'

/**
 * Response DTO for revealing API credential secrets
 * Extends metadata to include decrypted credentials
 * Only used in the /reveal endpoint
 */
export class CredentialSecretsDto extends CredentialMetadataDto {
  credentials!: Record<string, any> // Decrypted credentials
}
