/**
 * Storage Provider Interface
 *
 * Abstract interface for all storage providers (Supabase, R2, B2).
 * Provides a unified API for file operations across different storage backends.
 */

import { ApiProvider } from '@tailfire/shared-types'

/**
 * Upload options
 */
export interface UploadOptions {
  /** MIME content type */
  contentType?: string
  /** Whether to overwrite existing files */
  upsert?: boolean
  /** Custom metadata */
  metadata?: Record<string, string>
  /** Cache control header */
  cacheControl?: string
}

/**
 * File metadata returned from list operations
 */
export interface FileMetadata {
  /** File name */
  name: string
  /** Full storage path */
  path: string
  /** File size in bytes */
  size: number
  /** Last modified timestamp */
  lastModified: Date
  /** Content type if available */
  contentType?: string
}

/**
 * Connection test result
 */
export interface ConnectionTestResult {
  /** Whether the test succeeded */
  success: boolean
  /** Human-readable message */
  message: string
  /** Error details if test failed */
  error?: string
  /** Response time in milliseconds */
  responseTimeMs?: number
}

/**
 * Abstract Storage Provider Interface
 *
 * All storage providers must implement this interface.
 */
export interface StorageProvider {
  /**
   * Provider type identifier
   */
  readonly provider: ApiProvider

  /**
   * Upload a file to storage
   *
   * @param file - Buffer containing file data
   * @param path - Destination path in storage (including filename)
   * @param options - Upload options
   * @returns Full storage path of uploaded file
   */
  upload(
    file: Buffer,
    path: string,
    options?: UploadOptions
  ): Promise<string>

  /**
   * Download a file from storage
   *
   * @param path - Storage path of the file
   * @returns File buffer
   */
  download(path: string): Promise<Buffer>

  /**
   * Delete a file from storage
   *
   * @param path - Storage path of the file to delete
   */
  delete(path: string): Promise<void>

  /**
   * Delete multiple files from storage
   *
   * @param paths - Array of storage paths to delete
   */
  deleteMany(paths: string[]): Promise<void>

  /**
   * List files with optional prefix filter
   *
   * @param prefix - Path prefix to filter by (e.g., 'componentId/')
   * @param limit - Maximum number of results (default: 1000)
   * @returns Array of file metadata
   */
  list(prefix?: string, limit?: number): Promise<FileMetadata[]>

  /**
   * Generate a signed URL for private file access
   *
   * @param path - Storage path of the file
   * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
   * @returns Signed URL string
   */
  getSignedUrl(path: string, expiresIn?: number): Promise<string>

  /**
   * Check if a file exists at the given path
   *
   * @param path - Storage path to check
   * @returns True if file exists, false otherwise
   */
  exists(path: string): Promise<boolean>

  /**
   * Test connectivity to the storage provider
   *
   * Performs a lightweight operation to verify:
   * - Credentials are valid
   * - Bucket/container is accessible
   * - Network connectivity is working
   *
   * @returns Connection test result with success status and message
   */
  testConnection(): Promise<ConnectionTestResult>

  /**
   * Get provider-specific configuration info (for debugging)
   *
   * @returns Object with non-sensitive configuration details
   */
  getProviderInfo(): {
    provider: ApiProvider
    bucketName: string
    region?: string
    endpoint?: string
  }

  /**
   * Get public URL for a file
   *
   * For public buckets (like media storage), returns the direct public URL.
   * For private buckets, this may return undefined or throw an error.
   *
   * @param path - Storage path of the file
   * @returns Public URL or undefined if not supported
   */
  getPublicUrl(path: string): string | undefined
}
