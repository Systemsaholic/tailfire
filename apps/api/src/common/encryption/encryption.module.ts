import { Module, Global } from '@nestjs/common'
import { EncryptionService } from './encryption.service'

/**
 * EncryptionModule
 *
 * Provides encryption/decryption services using AES-256-GCM.
 * This module is global, so you don't need to import it in other modules.
 */
@Global()
@Module({
  providers: [EncryptionService],
  exports: [EncryptionService],
})
export class EncryptionModule {}
