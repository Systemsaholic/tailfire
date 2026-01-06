/**
 * Unit tests for BackblazeB2Provider
 */

import { BackblazeB2Provider } from '../backblaze-b2.provider'
import { ApiProvider, BackblazeB2Credentials } from '@tailfire/shared-types'
import { createMockS3Client, setupMockS3Client } from './s3-client.mock'
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  S3Client
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3', () => {
  const actual = jest.requireActual('@aws-sdk/client-s3')
  return {
    ...actual,
    S3Client: jest.fn(),
  }
})
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}))

describe('BackblazeB2Provider', () => {
  let provider: BackblazeB2Provider
  let mockClient: any
  const mockCredentials: BackblazeB2Credentials = {
    keyId: 'test-key-id',
    applicationKey: 'test-application-key',
    bucketName: 'test-bucket',
    endpoint: 'https://s3.us-west-002.backblazeb2.com',
  }

  beforeEach(() => {
    mockClient = createMockS3Client()
    ;(S3Client as jest.Mock).mockImplementation(() => mockClient)
    provider = new BackblazeB2Provider(mockCredentials, mockCredentials.bucketName)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with correct provider type', () => {
      expect(provider.provider).toBe(ApiProvider.BACKBLAZE_B2)
    })
  })

  describe('upload', () => {
    const testFile = Buffer.from('test file content')
    const testPath = 'uploads/test-file.jpg'

    beforeEach(() => {
      setupMockS3Client(mockClient, { putObject: 'success' })
    })

    it('should upload file successfully', async () => {
      const result = await provider.upload(testFile, testPath)

      expect(mockClient.send).toHaveBeenCalledWith(
        expect.any(PutObjectCommand)
      )
      expect(result).toBe(testPath)
    })

    it('should upload with custom content type', async () => {
      const options = {
        contentType: 'image/jpeg',
      }

      await provider.upload(testFile, testPath, options)

      const callArg = mockClient.send.mock.calls[0][0]
      expect(callArg).toBeInstanceOf(PutObjectCommand)
      expect(callArg.input.ContentType).toBe('image/jpeg')
    })

    it('should upload with cache control', async () => {
      const options = {
        cacheControl: 'public, max-age=3600',
      }

      await provider.upload(testFile, testPath, options)

      const callArg = mockClient.send.mock.calls[0][0]
      expect(callArg.input.CacheControl).toBe('public, max-age=3600')
    })

    it('should throw error when upload fails', async () => {
      setupMockS3Client(mockClient, { putObject: 'error' })

      await expect(provider.upload(testFile, testPath)).rejects.toThrow()
    })

    it('should throw error when access denied', async () => {
      setupMockS3Client(mockClient, { putObject: 'accessDenied' })

      await expect(provider.upload(testFile, testPath)).rejects.toThrow()
    })
  })

  describe('download', () => {
    const testPath = 'uploads/test-file.jpg'

    beforeEach(() => {
      setupMockS3Client(mockClient, { getObject: 'success' })
    })

    it('should download file successfully', async () => {
      const result = await provider.download(testPath)

      expect(mockClient.send).toHaveBeenCalledWith(
        expect.any(GetObjectCommand)
      )
      expect(result).toBeInstanceOf(Buffer)
    })

    it('should throw error when file not found', async () => {
      setupMockS3Client(mockClient, { getObject: 'notFound' })

      await expect(provider.download(testPath)).rejects.toThrow()
    })

    it('should throw error on network error', async () => {
      setupMockS3Client(mockClient, { getObject: 'error' })

      await expect(provider.download(testPath)).rejects.toThrow()
    })
  })

  describe('delete', () => {
    const testPath = 'uploads/test-file.jpg'

    beforeEach(() => {
      setupMockS3Client(mockClient, { deleteObject: 'success' })
    })

    it('should delete file successfully', async () => {
      await provider.delete(testPath)

      expect(mockClient.send).toHaveBeenCalledWith(
        expect.any(DeleteObjectCommand)
      )
    })

    it('should handle deletion of non-existent file', async () => {
      setupMockS3Client(mockClient, { deleteObject: 'notFound' })

      await expect(provider.delete(testPath)).rejects.toThrow()
    })

    it('should throw error on network error', async () => {
      setupMockS3Client(mockClient, { deleteObject: 'error' })

      await expect(provider.delete(testPath)).rejects.toThrow()
    })
  })

  describe('getSignedUrl', () => {
    const testPath = 'uploads/test-file.jpg'
    const mockSignedUrl = 'https://s3.us-west-002.backblazeb2.com/test-bucket/uploads/test-file.jpg?signature=abc123'

    beforeEach(() => {
      ;(getSignedUrl as jest.Mock).mockResolvedValue(mockSignedUrl)
    })

    it('should get signed URL with default expiry', async () => {
      const result = await provider.getSignedUrl(testPath)

      expect(getSignedUrl).toHaveBeenCalledWith(
        mockClient,
        expect.any(GetObjectCommand),
        expect.objectContaining({
          expiresIn: 3600,
        })
      )
      expect(result).toBe(mockSignedUrl)
    })

    it('should get signed URL with custom expiry', async () => {
      const expiresIn = 7200

      await provider.getSignedUrl(testPath, expiresIn)

      expect(getSignedUrl).toHaveBeenCalledWith(
        mockClient,
        expect.any(GetObjectCommand),
        expect.objectContaining({
          expiresIn: 7200,
        })
      )
    })

    it('should throw error when signing fails', async () => {
      ;(getSignedUrl as jest.Mock).mockRejectedValue(new Error('Signing failed'))

      await expect(provider.getSignedUrl(testPath)).rejects.toThrow(
        'B2 signed URL creation failed:'
      )
    })
  })

  describe('testConnection', () => {
    it('should return success when connection works', async () => {
      setupMockS3Client(mockClient, { listObjectsV2: 'success', putObject: 'success', deleteObject: 'success' })

      const result = await provider.testConnection()

      expect(result.success).toBe(true)
      expect(result.message).toContain('Successfully connected')
      expect(mockClient.send).toHaveBeenCalledWith(
        expect.any(ListObjectsV2Command)
      )
    })

    it('should return failure when bucket not found', async () => {
      setupMockS3Client(mockClient, { listObjectsV2: 'notFound' })

      const result = await provider.testConnection()

      expect(result.success).toBe(false)
      expect(result.message).toContain('B2 connection test failed')
      expect(result.error).toBeDefined()
    })

    it('should return failure when access denied', async () => {
      setupMockS3Client(mockClient, { listObjectsV2: 'accessDenied' })

      const result = await provider.testConnection()

      expect(result.success).toBe(false)
      expect(result.message).toContain('B2 connection test failed')
    })

    it('should return failure on network error', async () => {
      setupMockS3Client(mockClient, { listObjectsV2: 'error' })

      const result = await provider.testConnection()

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle custom error messages', async () => {
      const customError = new Error('Custom connection error')
      mockClient.send.mockRejectedValue(customError)

      const result = await provider.testConnection()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Custom connection error')
    })
  })
})
