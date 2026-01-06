/**
 * Storage Service
 *
 * Handles file uploads to various storage providers (Supabase, R2, B2).
 * Supports two bucket types:
 * - Documents: Private files accessed via signed URLs (invoices, contracts, etc.)
 * - Media: Public files accessed via direct URLs (images, thumbnails, etc.)
 *
 * The active storage provider is determined by the API Credentials Manager.
 * Configure credentials via the admin panel at /api/api-credentials
 */

import { Injectable, OnModuleInit, Logger } from '@nestjs/common'
import { StorageProviderFactory, StorageProvider, ConnectionTestResult } from '../storage/providers'
import { ApiProvider } from '@tailfire/shared-types'

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name)
  private documentProvider: StorageProvider | null = null
  private mediaProvider: StorageProvider | null = null

  constructor(
    private readonly providerFactory: StorageProviderFactory,
  ) {}

  async onModuleInit() {
    // Initialize storage providers
    await this.initializeProviders()
  }

  /**
   * Initialize storage providers from factory
   */
  private async initializeProviders(): Promise<void> {
    // Initialize documents provider
    try {
      this.documentProvider = await this.providerFactory.getActiveProvider()
      const info = this.documentProvider.getProviderInfo()
      this.logger.log(
        `Documents provider initialized: ${info.provider} (bucket: ${info.bucketName})`
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error(
        `Failed to initialize documents provider: ${errorMessage}. ` +
        'Configure credentials via admin panel at /api/api-credentials'
      )
      this.documentProvider = null
    }

    // Initialize media provider
    try {
      this.mediaProvider = await this.providerFactory.getMediaProvider()
      const info = this.mediaProvider.getProviderInfo()
      this.logger.log(
        `Media provider initialized: ${info.provider} (bucket: ${info.bucketName})`
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error(
        `Failed to initialize media provider: ${errorMessage}. ` +
        'Configure credentials via admin panel at /api/api-credentials'
      )
      this.mediaProvider = null
    }
  }

  // Legacy getter for backwards compatibility
  private get provider(): StorageProvider | null {
    return this.documentProvider
  }

  /**
   * Refresh storage provider credentials (call after rotation)
   */
  async refreshCredentials(): Promise<void> {
    this.logger.log('Refreshing storage credentials')
    this.providerFactory.clearCache()
    await this.initializeProviders()
  }

  /**
   * Switch to a specific storage provider
   *
   * @param provider - Provider type to switch to
   */
  async switchProvider(provider: ApiProvider): Promise<void> {
    this.logger.log(`Switching to storage provider: ${provider}`)
    this.documentProvider = await this.providerFactory.getProvider(provider, 'documents')
    this.mediaProvider = await this.providerFactory.getProvider(provider, 'media')
    const info = this.documentProvider.getProviderInfo()
    this.logger.log(`Switched to ${info.provider} for both documents and media`)
  }

  /**
   * Check if document storage is available
   */
  isAvailable(): boolean {
    return this.documentProvider !== null
  }

  /**
   * Check if media storage is available
   */
  isMediaAvailable(): boolean {
    return this.mediaProvider !== null
  }

  /**
   * Get current provider info
   */
  getProviderInfo() {
    if (!this.provider) {
      throw new Error('Storage service not available')
    }
    return this.provider.getProviderInfo()
  }

  /**
   * Test connectivity to the current storage provider
   */
  async testConnection(): Promise<ConnectionTestResult> {
    if (!this.provider) {
      return {
        success: false,
        message: 'No storage provider configured',
        error: 'Storage service not initialized. Please configure credentials.',
      }
    }

    return await this.provider.testConnection()
  }

  /**
   * Upload a document file to storage
   *
   * @param file - Buffer of file data
   * @param componentId - ID of the component this document belongs to
   * @param fileName - Original filename
   * @param contentType - MIME type of the file
   * @returns Storage path (not public URL - use getSignedUrl for downloads)
   */
  async uploadDocument(
    file: Buffer,
    componentId: string,
    fileName: string,
    contentType: string
  ): Promise<string> {
    if (!this.provider) {
      throw new Error('Storage service not available')
    }

    // Create unique path: {componentId}/{timestamp}-{filename}
    const timestamp = Date.now()
    const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const path = `${componentId}/${timestamp}-${safeName}`

    return await this.provider.upload(file, path, { contentType })
  }

  /**
   * Delete a document from storage
   *
   * @param storagePath - Storage path of the file to delete
   */
  async deleteDocument(storagePath: string): Promise<void> {
    if (!this.provider) {
      throw new Error('Storage service not available')
    }

    await this.provider.delete(storagePath)
  }

  /**
   * Get a signed URL for private file access
   *
   * @param storagePath - Storage path of the file
   * @param expiresIn - Expiration time in seconds (default: 1 hour)
   * @returns Signed URL
   */
  async getSignedUrl(storagePath: string, expiresIn: number = 3600): Promise<string> {
    if (!this.provider) {
      throw new Error('Storage service not available')
    }

    return await this.provider.getSignedUrl(storagePath, expiresIn)
  }

  /**
   * Delete all documents for a component
   *
   * @param componentId - ID of the component
   */
  async deleteComponentDocuments(componentId: string): Promise<void> {
    if (!this.provider) {
      throw new Error('Storage service not available')
    }

    // List all files in the component folder
    const files = await this.provider.list(componentId)

    if (!files || files.length === 0) {
      return
    }

    // Delete all files
    const paths = files.map(file => file.path)
    await this.provider.deleteMany(paths)
  }

  /**
   * Download a document from storage
   *
   * @param storagePath - Storage path of the file
   * @returns File buffer
   */
  async downloadDocument(storagePath: string): Promise<Buffer> {
    if (!this.provider) {
      throw new Error('Storage service not available')
    }

    return await this.provider.download(storagePath)
  }

  /**
   * List all documents for a component
   *
   * @param componentId - ID of the component
   * @returns Array of file metadata
   */
  async listComponentDocuments(componentId: string) {
    if (!this.provider) {
      throw new Error('Storage service not available')
    }

    return await this.provider.list(componentId)
  }

  /**
   * Check if a document exists
   *
   * @param storagePath - Storage path to check
   * @returns True if file exists
   */
  async documentExists(storagePath: string): Promise<boolean> {
    if (!this.provider) {
      throw new Error('Storage service not available')
    }

    return await this.provider.exists(storagePath)
  }

  // ========================================
  // MEDIA STORAGE METHODS (Public Bucket)
  // ========================================

  /**
   * Upload a media file to public storage
   *
   * @param file - Buffer of file data
   * @param path - Storage path (e.g., 'trips/{tripId}/gallery/{filename}')
   * @param contentType - MIME type of the file
   * @returns Public URL for the uploaded file
   */
  async uploadMedia(
    file: Buffer,
    path: string,
    contentType: string
  ): Promise<string> {
    if (!this.mediaProvider) {
      throw new Error(
        'Media storage service not available. ' +
        'Ensure R2_MEDIA_BUCKET and R2_MEDIA_PUBLIC_URL environment variables are configured.'
      )
    }

    const startTime = Date.now()
    await this.mediaProvider.upload(file, path, { contentType })
    const publicUrl = this.providerFactory.getMediaPublicUrl(path)

    this.logger.log(
      `[MEDIA] Uploaded ${file.length} bytes to ${path} (${Date.now() - startTime}ms) → ${publicUrl}`
    )

    return publicUrl
  }

  /**
   * Upload a media file with auto-generated unique path
   *
   * @param file - Buffer of file data
   * @param folder - Folder path (e.g., 'trips/{tripId}/gallery')
   * @param fileName - Original filename
   * @param contentType - MIME type of the file
   * @returns Object with storage path and public URL
   */
  async uploadMediaFile(
    file: Buffer,
    folder: string,
    fileName: string,
    contentType: string
  ): Promise<{ path: string; url: string }> {
    if (!this.mediaProvider) {
      throw new Error(
        'Media storage service not available. ' +
        'Ensure R2_MEDIA_BUCKET and R2_MEDIA_PUBLIC_URL environment variables are configured.'
      )
    }

    // Create unique path: {folder}/{timestamp}-{filename}
    const timestamp = Date.now()
    const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const path = `${folder}/${timestamp}-${safeName}`

    const startTime = Date.now()
    await this.mediaProvider.upload(file, path, { contentType })
    const url = this.providerFactory.getMediaPublicUrl(path)

    this.logger.log(
      `[MEDIA] Uploaded ${file.length} bytes: ${fileName} → ${path} (${Date.now() - startTime}ms)`
    )

    return { path, url }
  }

  /**
   * Get public URL for a media file
   *
   * @param storagePath - Storage path of the media file
   * @returns Public URL (no expiration)
   */
  getMediaUrl(storagePath: string): string {
    return this.providerFactory.getMediaPublicUrl(storagePath)
  }

  /**
   * Delete a media file from public storage
   *
   * @param storagePath - Storage path of the file to delete
   */
  async deleteMedia(storagePath: string): Promise<void> {
    if (!this.mediaProvider) {
      throw new Error('Media storage service not available')
    }

    await this.mediaProvider.delete(storagePath)
    this.logger.log(`[MEDIA] Deleted: ${storagePath}`)
  }

  /**
   * Delete multiple media files
   *
   * @param storagePaths - Array of storage paths to delete
   */
  async deleteMediaFiles(storagePaths: string[]): Promise<void> {
    if (!this.mediaProvider) {
      throw new Error('Media storage service not available')
    }

    if (storagePaths.length === 0) return
    await this.mediaProvider.deleteMany(storagePaths)
    this.logger.log(`[MEDIA] Deleted ${storagePaths.length} files`)
  }

  /**
   * List all media files in a folder
   *
   * @param folder - Folder path (e.g., 'trips/{tripId}/gallery')
   * @returns Array of file metadata with public URLs
   */
  async listMediaFiles(folder: string) {
    if (!this.mediaProvider) {
      throw new Error('Media storage service not available')
    }

    const files = await this.mediaProvider.list(folder)
    return files.map(file => ({
      ...file,
      url: this.providerFactory.getMediaPublicUrl(file.path),
    }))
  }

  /**
   * Check if a media file exists
   *
   * @param storagePath - Storage path to check
   * @returns True if file exists
   */
  async mediaExists(storagePath: string): Promise<boolean> {
    if (!this.mediaProvider) {
      throw new Error('Media storage service not available')
    }

    return await this.mediaProvider.exists(storagePath)
  }

  /**
   * Test media storage connection
   */
  async testMediaConnection(): Promise<ConnectionTestResult> {
    if (!this.mediaProvider) {
      return {
        success: false,
        message: 'No media storage provider configured',
        error: 'Media storage service not initialized. Please configure credentials.',
      }
    }

    return await this.mediaProvider.testConnection()
  }
}
