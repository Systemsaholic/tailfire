/**
 * Backblaze B2 Provider Integration Tests
 *
 * These tests run against real B2 infrastructure and require valid credentials.
 * Set the following environment variables to run these tests:
 *
 * - B2_KEY_ID: B2 application key ID
 * - B2_APPLICATION_KEY: B2 application key
 * - B2_BUCKET_NAME: B2 bucket name
 * - B2_ENDPOINT: B2 S3-compatible endpoint (e.g., s3.us-west-004.backblazeb2.com)
 * - B2_REGION: Optional region (e.g., us-west-004)
 *
 * To run only integration tests:
 *   B2_KEY_ID=xxx B2_APPLICATION_KEY=xxx B2_BUCKET_NAME=xxx B2_ENDPOINT=xxx pnpm test -- --testPathPattern=integration
 */

import { BackblazeB2Provider } from '../backblaze-b2.provider'
import type { BackblazeB2Credentials } from '@tailfire/shared-types'
import type { ConnectionTestResult, FileMetadata } from '../storage-provider.interface'

// Check if B2 credentials are available
const B2_CREDENTIALS: BackblazeB2Credentials | null = process.env.B2_KEY_ID && process.env.B2_APPLICATION_KEY
  ? {
      keyId: process.env.B2_KEY_ID,
      applicationKey: process.env.B2_APPLICATION_KEY,
      bucketName: process.env.B2_BUCKET_NAME || 'tailfire-test',
      endpoint: process.env.B2_ENDPOINT || 's3.us-west-004.backblazeb2.com',
      region: process.env.B2_REGION || 'us-west-004',
    }
  : null

const SKIP_REASON = 'B2 credentials not configured. Set B2_KEY_ID and B2_APPLICATION_KEY environment variables.'

// Helper to generate unique test paths
function generateTestPath(suffix: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  return `integration-tests/${timestamp}-${random}-${suffix}`
}

// Test file content
const TEST_CONTENT = Buffer.from('Integration test content - Tailfire B2 Provider')

describe('BackblazeB2Provider Integration Tests', () => {
  // Track all test files for cleanup
  const testFiles: string[] = []
  let provider: BackblazeB2Provider | null = null

  beforeAll(() => {
    if (B2_CREDENTIALS) {
      provider = new BackblazeB2Provider(B2_CREDENTIALS, B2_CREDENTIALS.bucketName)
    }
  })

  afterAll(async () => {
    // Clean up all test files
    if (provider && testFiles.length > 0) {
      console.log(`Cleaning up ${testFiles.length} test files...`)
      try {
        await provider.deleteMany(testFiles)
        console.log('Cleanup complete')
      } catch (error) {
        console.warn('Cleanup warning:', error)
      }
    }
  })

  describe('testConnection', () => {
    it('should successfully connect to B2', async () => {
      if (!provider) {
        console.log(SKIP_REASON)
        return
      }

      const result: ConnectionTestResult = await provider.testConnection()
      expect(result.success).toBe(true)
      expect(result.message).toBeDefined()
    })
  })

  describe('upload', () => {
    it('should upload a buffer to B2', async () => {
      if (!provider) {
        console.log(SKIP_REASON)
        return
      }

      const testPath = generateTestPath('buffer-upload.txt')
      testFiles.push(testPath)

      const result = await provider.upload(TEST_CONTENT, testPath, {
        contentType: 'text/plain',
      })

      expect(result).toBe(testPath)
    })

    it('should upload with custom metadata', async () => {
      if (!provider) {
        console.log(SKIP_REASON)
        return
      }

      const testPath = generateTestPath('metadata-upload.json')
      testFiles.push(testPath)

      const content = Buffer.from(JSON.stringify({ test: true, timestamp: Date.now() }))
      const result = await provider.upload(content, testPath, {
        contentType: 'application/json',
        metadata: {
          'x-test-id': 'integration-test',
          'x-test-source': 'tailfire',
        },
      })

      expect(result).toBe(testPath)
    })
  })

  describe('download', () => {
    it('should download a previously uploaded file', async () => {
      if (!provider) {
        console.log(SKIP_REASON)
        return
      }

      // First upload a file
      const testPath = generateTestPath('download-test.txt')
      testFiles.push(testPath)

      const uploadContent = Buffer.from('Content to be downloaded')
      await provider.upload(uploadContent, testPath, {
        contentType: 'text/plain',
      })

      // Now download it
      const result = await provider.download(testPath)

      expect(result).toBeDefined()
      expect(result).toBeInstanceOf(Buffer)
      expect(result.toString()).toBe(uploadContent.toString())
    })

    it('should throw error for non-existent file', async () => {
      if (!provider) {
        console.log(SKIP_REASON)
        return
      }

      const nonExistentPath = generateTestPath('non-existent-file.txt')

      await expect(provider.download(nonExistentPath)).rejects.toThrow()
    })
  })

  describe('exists', () => {
    it('should return true for existing file', async () => {
      if (!provider) {
        console.log(SKIP_REASON)
        return
      }

      // Upload a file first
      const testPath = generateTestPath('exists-test.txt')
      testFiles.push(testPath)

      await provider.upload(Buffer.from('Test content'), testPath, {
        contentType: 'text/plain',
      })

      const result = await provider.exists(testPath)
      expect(result).toBe(true)
    })

    it('should return false for non-existent file', async () => {
      if (!provider) {
        console.log(SKIP_REASON)
        return
      }

      const nonExistentPath = generateTestPath('does-not-exist.txt')
      const result = await provider.exists(nonExistentPath)
      expect(result).toBe(false)
    })
  })

  describe('list', () => {
    it('should list files with prefix', async () => {
      if (!provider) {
        console.log(SKIP_REASON)
        return
      }

      // Create a unique prefix for this test
      const prefix = `integration-tests/list-${Date.now()}`

      // Upload multiple files
      const files = ['file1.txt', 'file2.txt', 'file3.json']
      for (const file of files) {
        const path = `${prefix}/${file}`
        testFiles.push(path)
        await provider.upload(Buffer.from(`Content for ${file}`), path, {
          contentType: file.endsWith('.json') ? 'application/json' : 'text/plain',
        })
      }

      // List files
      const result: FileMetadata[] = await provider.list(prefix + '/')

      expect(result).toHaveLength(3)
      expect(result.map((f: FileMetadata) => f.path).sort()).toEqual(
        files.map(f => `${prefix}/${f}`).sort()
      )
    })

    it('should handle empty prefix result', async () => {
      if (!provider) {
        console.log(SKIP_REASON)
        return
      }

      const nonExistentPrefix = `integration-tests/non-existent-${Date.now()}/`
      const result = await provider.list(nonExistentPrefix)

      expect(result).toHaveLength(0)
    })
  })

  describe('getSignedUrl', () => {
    it('should generate a signed URL for download', async () => {
      if (!provider) {
        console.log(SKIP_REASON)
        return
      }

      // Upload a file first
      const testPath = generateTestPath('signed-url-test.txt')
      testFiles.push(testPath)

      await provider.upload(Buffer.from('Signed URL content'), testPath, {
        contentType: 'text/plain',
      })

      const signedUrl = await provider.getSignedUrl(testPath, 3600) // 1 hour

      expect(signedUrl).toBeDefined()
      expect(typeof signedUrl).toBe('string')
      expect(signedUrl).toContain('X-Amz-Signature')
      expect(signedUrl).toContain(B2_CREDENTIALS!.endpoint)
    })
  })

  describe('delete', () => {
    it('should delete a single file', async () => {
      if (!provider) {
        console.log(SKIP_REASON)
        return
      }

      // Upload a file first
      const testPath = generateTestPath('delete-single.txt')

      await provider.upload(Buffer.from('Content to delete'), testPath, {
        contentType: 'text/plain',
      })

      // Verify it exists
      const existsBefore = await provider.exists(testPath)
      expect(existsBefore).toBe(true)

      // Delete it
      await provider.delete(testPath)

      // Verify it's gone
      const existsAfter = await provider.exists(testPath)
      expect(existsAfter).toBe(false)
    })

    it('should not throw when deleting non-existent file', async () => {
      if (!provider) {
        console.log(SKIP_REASON)
        return
      }

      const nonExistentPath = generateTestPath('never-existed.txt')

      // Should not throw
      await expect(provider.delete(nonExistentPath)).resolves.not.toThrow()
    })
  })

  describe('deleteMany', () => {
    it('should delete multiple files at once', async () => {
      if (!provider) {
        console.log(SKIP_REASON)
        return
      }

      const prefix = `integration-tests/delete-many-${Date.now()}`
      const paths: string[] = []

      // Upload multiple files
      for (let i = 0; i < 3; i++) {
        const path = `${prefix}/file${i}.txt`
        paths.push(path)
        await provider.upload(Buffer.from(`Content ${i}`), path, {
          contentType: 'text/plain',
        })
      }

      // Verify they exist
      for (const path of paths) {
        const exists = await provider.exists(path)
        expect(exists).toBe(true)
      }

      // Delete all
      await provider.deleteMany(paths)

      // Verify they're gone
      for (const path of paths) {
        const exists = await provider.exists(path)
        expect(exists).toBe(false)
      }
    })
  })

  describe('getProviderInfo', () => {
    it('should return provider configuration info', async () => {
      if (!provider) {
        console.log(SKIP_REASON)
        return
      }

      const info = provider.getProviderInfo()

      expect(info.provider).toBe('backblaze_b2')
      expect(info.bucketName).toBe(B2_CREDENTIALS!.bucketName)
    })
  })

  describe('end-to-end workflow', () => {
    it('should handle complete upload-download-delete workflow', async () => {
      if (!provider) {
        console.log(SKIP_REASON)
        return
      }

      const testPath = generateTestPath('e2e-workflow.pdf')
      const content = Buffer.from('%PDF-1.4 mock content for integration test')

      // 1. Upload
      const uploadResult = await provider.upload(content, testPath, {
        contentType: 'application/pdf',
        metadata: {
          'x-test': 'e2e',
        },
      })
      expect(uploadResult).toBe(testPath)

      // 2. Verify exists
      const exists = await provider.exists(testPath)
      expect(exists).toBe(true)

      // 3. Download and verify content
      const downloadResult = await provider.download(testPath)
      expect(downloadResult.toString()).toBe(content.toString())

      // 4. Get signed URL
      const signedUrl = await provider.getSignedUrl(testPath, 300)
      expect(signedUrl).toContain('X-Amz-Signature')

      // 5. Delete
      await provider.delete(testPath)

      // 6. Verify deleted
      const existsAfter = await provider.exists(testPath)
      expect(existsAfter).toBe(false)
    })
  })
})
