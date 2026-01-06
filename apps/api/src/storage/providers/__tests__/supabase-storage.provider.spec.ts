/**
 * Unit tests for SupabaseStorageProvider
 */

import { SupabaseStorageProvider } from '../supabase-storage.provider'
import { ApiProvider, SupabaseStorageCredentials } from '@tailfire/shared-types'
import { createMockSupabaseClient, setupMockSupabaseClient, mockSupabaseResponses } from './supabase-client.mock'

// Mock the @supabase/supabase-js createClient
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}))

import { createClient } from '@supabase/supabase-js'

describe('SupabaseStorageProvider', () => {
  let provider: SupabaseStorageProvider
  let mockClient: any
  const mockCredentials: SupabaseStorageCredentials = {
    url: 'https://test-project.supabase.co',
    serviceRoleKey: 'mock-service-role-key',
  }
  const bucketName = 'test-bucket'

  beforeEach(() => {
    mockClient = createMockSupabaseClient()
    ;(createClient as jest.Mock).mockReturnValue(mockClient)
    provider = new SupabaseStorageProvider(mockCredentials, bucketName)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with correct provider type', () => {
      expect(provider.provider).toBe(ApiProvider.SUPABASE_STORAGE)
    })

    it('should create Supabase client with correct credentials', () => {
      expect(createClient).toHaveBeenCalledWith(
        mockCredentials.url,
        mockCredentials.serviceRoleKey,
        expect.objectContaining({
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        })
      )
    })
  })

  describe('upload', () => {
    const testFile = Buffer.from('test file content')
    const testPath = 'uploads/test-file.jpg'

    beforeEach(() => {
      setupMockSupabaseClient(mockClient, { upload: 'success' })
    })

    it('should upload file successfully', async () => {
      const result = await provider.upload(testFile, testPath)

      expect(mockClient.storage.from).toHaveBeenCalledWith(bucketName)
      expect(mockClient.storage.upload).toHaveBeenCalledWith(
        testPath,
        testFile,
        expect.objectContaining({
          upsert: false,
        })
      )
      expect(result).toBe(mockSupabaseResponses.upload.data.path)
    })

    it('should upload with custom options', async () => {
      const options = {
        contentType: 'image/jpeg',
        upsert: true,
        cacheControl: 'public, max-age=3600',
      }

      await provider.upload(testFile, testPath, options)

      expect(mockClient.storage.upload).toHaveBeenCalledWith(
        testPath,
        testFile,
        expect.objectContaining({
          contentType: 'image/jpeg',
          upsert: true,
          cacheControl: 'public, max-age=3600',
        })
      )
    })

    it('should throw error when upload fails', async () => {
      setupMockSupabaseClient(mockClient, { upload: 'uploadFailed' })

      await expect(provider.upload(testFile, testPath)).rejects.toThrow(
        'Supabase upload failed:'
      )
    })

    it('should throw error when bucket not found', async () => {
      setupMockSupabaseClient(mockClient, { upload: 'bucketNotFound' })

      await expect(provider.upload(testFile, testPath)).rejects.toThrow()
    })

    it('should throw error when access denied', async () => {
      setupMockSupabaseClient(mockClient, { upload: 'accessDenied' })

      await expect(provider.upload(testFile, testPath)).rejects.toThrow()
    })
  })

  describe('download', () => {
    const testPath = 'uploads/test-file.jpg'

    beforeEach(() => {
      setupMockSupabaseClient(mockClient, { download: 'success' })
    })

    it('should download file successfully', async () => {
      const result = await provider.download(testPath)

      expect(mockClient.storage.from).toHaveBeenCalledWith(bucketName)
      expect(mockClient.storage.download).toHaveBeenCalledWith(testPath)
      expect(result).toBeInstanceOf(Buffer)
    })

    it('should throw error when file not found', async () => {
      setupMockSupabaseClient(mockClient, { download: 'fileNotFound' })

      await expect(provider.download(testPath)).rejects.toThrow(
        'Supabase download failed:'
      )
    })

    it('should throw error when access denied', async () => {
      setupMockSupabaseClient(mockClient, { download: 'accessDenied' })

      await expect(provider.download(testPath)).rejects.toThrow()
    })
  })

  describe('delete', () => {
    const testPath = 'uploads/test-file.jpg'

    beforeEach(() => {
      setupMockSupabaseClient(mockClient, { remove: 'success' })
    })

    it('should delete file successfully', async () => {
      await provider.delete(testPath)

      expect(mockClient.storage.from).toHaveBeenCalledWith(bucketName)
      expect(mockClient.storage.remove).toHaveBeenCalledWith([testPath])
    })

    it('should throw error when file not found', async () => {
      setupMockSupabaseClient(mockClient, { remove: 'fileNotFound' })

      await expect(provider.delete(testPath)).rejects.toThrow(
        'Supabase delete failed:'
      )
    })

    it('should throw error when access denied', async () => {
      setupMockSupabaseClient(mockClient, { remove: 'accessDenied' })

      await expect(provider.delete(testPath)).rejects.toThrow()
    })
  })

  describe('getSignedUrl', () => {
    const testPath = 'uploads/test-file.jpg'

    beforeEach(() => {
      setupMockSupabaseClient(mockClient, { createSignedUrl: 'success' })
    })

    it('should get signed URL with default expiry', async () => {
      const result = await provider.getSignedUrl(testPath)

      expect(mockClient.storage.from).toHaveBeenCalledWith(bucketName)
      expect(mockClient.storage.createSignedUrl).toHaveBeenCalledWith(testPath, 3600)
      expect(result).toBe(mockSupabaseResponses.createSignedUrl.data.signedUrl)
    })

    it('should get signed URL with custom expiry', async () => {
      const expiresIn = 7200

      await provider.getSignedUrl(testPath, expiresIn)

      expect(mockClient.storage.createSignedUrl).toHaveBeenCalledWith(testPath, expiresIn)
    })

    it('should throw error when file not found', async () => {
      setupMockSupabaseClient(mockClient, { createSignedUrl: 'fileNotFound' })

      await expect(provider.getSignedUrl(testPath)).rejects.toThrow(
        'Supabase signed URL creation failed:'
      )
    })

    it('should throw error when access denied', async () => {
      setupMockSupabaseClient(mockClient, { createSignedUrl: 'accessDenied' })

      await expect(provider.getSignedUrl(testPath)).rejects.toThrow()
    })
  })

  describe('testConnection', () => {
    it('should return success when connection works', async () => {
      setupMockSupabaseClient(mockClient, { list: 'success', upload: 'success' })

      const result = await provider.testConnection()

      expect(result.success).toBe(true)
      expect(result.message).toContain('Successfully connected')
      expect(mockClient.storage.from).toHaveBeenCalledWith(bucketName)
      expect(mockClient.storage.list).toHaveBeenCalled()
    })

    it('should return failure when bucket not found', async () => {
      setupMockSupabaseClient(mockClient, { list: 'bucketNotFound' })

      const result = await provider.testConnection()

      expect(result.success).toBe(false)
      expect(result.message).toContain(`Failed to access bucket '${bucketName}'`)
      expect(result.error).toBeDefined()
    })

    it('should return failure when access denied', async () => {
      setupMockSupabaseClient(mockClient, { list: 'accessDenied' })

      const result = await provider.testConnection()

      expect(result.success).toBe(false)
      expect(result.message).toContain(`Failed to access bucket '${bucketName}'`)
    })
  })
})
