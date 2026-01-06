import { ApiProvider } from '@tailfire/shared-types'
import { CredentialStatus } from './update-credential.dto'

/**
 * Response DTO for API credential metadata
 * Does NOT include the decrypted credentials (use RevealCredentialDto for that)
 */
export class CredentialMetadataDto {
  id!: string
  parentId!: string | null
  provider!: ApiProvider
  name!: string
  version!: number
  isActive!: boolean
  status!: CredentialStatus
  lastRotatedAt!: Date | null
  expiresAt!: Date | null
  createdAt!: Date
  updatedAt!: Date
  createdBy!: string | null
  updatedBy!: string | null
}
