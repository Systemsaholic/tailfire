import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as crypto from 'crypto'

/**
 * Structure of encrypted data returned by encrypt()
 * All values are base64-encoded strings
 */
export interface EncryptedData {
  iv: string        // Initialization vector (base64)
  ciphertext: string // Encrypted data (base64)
  authTag: string   // Authentication tag for GCM (base64)
}

/**
 * EncryptionService
 *
 * Provides AES-256-GCM encryption/decryption for sensitive data.
 * The encryption key must be provided via ENCRYPTION_KEY environment variable
 * as a base64-encoded 32-byte key.
 *
 * @example
 * ```typescript
 * const encrypted = await encryptionService.encrypt(JSON.stringify(credentials))
 * const decrypted = await encryptionService.decrypt(encrypted)
 * ```
 */
@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name)
  private readonly encryptionKey: Buffer

  private readonly ALGORITHM = 'aes-256-gcm'
  private readonly IV_LENGTH = 16 // 128 bits

  /**
   * Constructor initializes the encryption key immediately to ensure it's available
   * before any other services attempt to use encryption during their onModuleInit.
   *
   * In test mode (NODE_ENV=test), generates a random key if none is provided.
   *
   * @throws Error if ENCRYPTION_KEY is missing or invalid (production only)
   */
  constructor(private readonly configService: ConfigService) {
    const nodeEnv = this.configService.get<string>('NODE_ENV')
    const isTestEnv = nodeEnv === 'test'
    let encryptionKeyBase64 = this.configService.get<string>('ENCRYPTION_KEY')

    if (!encryptionKeyBase64) {
      if (isTestEnv) {
        // Generate ephemeral key for test environment
        encryptionKeyBase64 = crypto.randomBytes(32).toString('base64')
        this.logger.debug('Generated ephemeral encryption key for test environment')
      } else {
        const errorMsg = 'ENCRYPTION_KEY environment variable is required but not set. Generate with: openssl rand -base64 32'
        this.logger.error(errorMsg)
        throw new Error(errorMsg)
      }
    }

    try {
      // Decode base64 string to Buffer
      this.encryptionKey = Buffer.from(encryptionKeyBase64, 'base64')

      // Validate key size (must be exactly 32 bytes for AES-256)
      if (this.encryptionKey.length !== 32) {
        throw new Error(
          `ENCRYPTION_KEY must be exactly 32 bytes (256 bits) when decoded. ` +
          `Got ${this.encryptionKey.length} bytes. Generate a new key with: openssl rand -base64 32`
        )
      }

      this.logger.debug('EncryptionService initialized with AES-256-GCM')
    } catch (error: unknown) {
      const errorMsg = `Failed to initialize EncryptionService: ${error instanceof Error ? error.message : String(error)}`
      this.logger.error(errorMsg)
      throw new Error(errorMsg)
    }
  }

  /**
   * Encrypts plaintext data using AES-256-GCM
   *
   * @param plaintext - The data to encrypt (string)
   * @returns EncryptedData object containing iv, ciphertext, and authTag (all base64-encoded)
   * @throws Error if encryption fails
   */
  encrypt(plaintext: string): EncryptedData {
    try {
      // Generate random IV
      const iv = crypto.randomBytes(this.IV_LENGTH)

      // Create cipher
      const cipher = crypto.createCipheriv(this.ALGORITHM, this.encryptionKey, iv)

      // Encrypt the data
      let ciphertext = cipher.update(plaintext, 'utf8', 'base64')
      ciphertext += cipher.final('base64')

      // Get authentication tag
      const authTag = cipher.getAuthTag()

      return {
        iv: iv.toString('base64'),
        ciphertext,
        authTag: authTag.toString('base64')
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      this.logger.error(`Encryption failed: ${errorMsg}`)
      throw new Error(`Encryption failed: ${errorMsg}`)
    }
  }

  /**
   * Decrypts data that was encrypted with encrypt()
   *
   * @param encrypted - EncryptedData object containing iv, ciphertext, and authTag
   * @returns Decrypted plaintext string
   * @throws Error if decryption fails or authentication tag verification fails
   */
  decrypt(encrypted: EncryptedData): string {
    try {
      // Convert base64 strings back to Buffers
      const iv = Buffer.from(encrypted.iv, 'base64')
      const authTag = Buffer.from(encrypted.authTag, 'base64')

      // Create decipher
      const decipher = crypto.createDecipheriv(this.ALGORITHM, this.encryptionKey, iv)

      // Set authentication tag
      decipher.setAuthTag(authTag)

      // Decrypt the data
      let plaintext = decipher.update(encrypted.ciphertext, 'base64', 'utf8')
      plaintext += decipher.final('utf8')

      return plaintext
    } catch (error: unknown) {
      // GCM authentication failures will throw here
      const errorMsg = error instanceof Error ? error.message : String(error)
      this.logger.error(`Decryption failed: ${errorMsg}`)
      throw new Error(`Decryption failed - data may be corrupted or tampered: ${errorMsg}`)
    }
  }

  /**
   * Encrypts a JSON-serializable object
   *
   * @param data - Object to encrypt
   * @returns EncryptedData
   */
  encryptObject<T>(data: T): EncryptedData {
    const plaintext = JSON.stringify(data)
    return this.encrypt(plaintext)
  }

  /**
   * Decrypts data and parses it as JSON
   *
   * @param encrypted - EncryptedData to decrypt
   * @returns Parsed object
   */
  decryptObject<T>(encrypted: EncryptedData): T {
    const plaintext = this.decrypt(encrypted)
    return JSON.parse(plaintext)
  }
}
