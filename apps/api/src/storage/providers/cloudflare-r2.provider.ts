/**
 * Cloudflare R2 Storage Provider
 *
 * Implementation of StorageProvider for Cloudflare R2.
 * Uses the AWS SDK S3 client since R2 is S3-compatible.
 *
 * Cloudflare R2 Benefits:
 * - Zero egress fees (free outbound data transfer)
 * - S3-compatible API
 * - Global edge network
 */

import { Logger } from '@nestjs/common'
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { ApiProvider, CloudflareR2Credentials } from '@tailfire/shared-types'
import {
  StorageProvider,
  UploadOptions,
  FileMetadata,
  ConnectionTestResult,
} from './storage-provider.interface'

export class CloudflareR2Provider implements StorageProvider {
  readonly provider = ApiProvider.CLOUDFLARE_R2
  private readonly logger = new Logger(CloudflareR2Provider.name)
  private client: S3Client
  private readonly endpoint: string

  constructor(
    credentials: CloudflareR2Credentials,
    private readonly bucketName: string
  ) {
    // Use provided endpoint or construct default R2 endpoint
    this.endpoint = credentials.endpoint ||
      `https://${credentials.accountId}.r2.cloudflarestorage.com`

    this.client = new S3Client({
      region: 'auto', // R2 uses 'auto' for region
      endpoint: this.endpoint,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      },
    })

    this.logger.log(`Initialized Cloudflare R2 provider (bucket: ${bucketName})`)
  }

  async upload(file: Buffer, path: string, options?: UploadOptions): Promise<string> {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: path,
          Body: file,
          ContentType: options?.contentType,
          CacheControl: options?.cacheControl,
          Metadata: options?.metadata,
        })
      )

      return path
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`R2 upload failed: ${message}`)
    }
  }

  async download(path: string): Promise<Buffer> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: path,
        })
      )

      if (!response.Body) {
        throw new Error(`File not found: ${path}`)
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = []
      for await (const chunk of response.Body as any) {
        chunks.push(chunk)
      }
      return Buffer.concat(chunks)
    } catch (error) {
      const errorName = error instanceof Error && 'name' in error ? (error as any).name : undefined
      if (errorName === 'NoSuchKey') {
        throw new Error(`File not found: ${path}`)
      }
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`R2 download failed: ${message}`)
    }
  }

  async delete(path: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: path,
        })
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`R2 delete failed: ${message}`)
    }
  }

  async deleteMany(paths: string[]): Promise<void> {
    if (paths.length === 0) return

    try {
      await this.client.send(
        new DeleteObjectsCommand({
          Bucket: this.bucketName,
          Delete: {
            Objects: paths.map(path => ({ Key: path })),
          },
        })
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`R2 batch delete failed: ${message}`)
    }
  }

  async list(prefix?: string, limit: number = 1000): Promise<FileMetadata[]> {
    try {
      const response = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucketName,
          Prefix: prefix,
          MaxKeys: limit,
        })
      )

      if (!response.Contents) {
        return []
      }

      return response.Contents.map(item => ({
        name: item.Key?.split('/').pop() || item.Key || '',
        path: item.Key || '',
        size: item.Size || 0,
        lastModified: item.LastModified || new Date(),
        contentType: undefined, // R2 doesn't return ContentType in list
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`R2 list failed: ${message}`)
    }
  }

  async getSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: path,
      })

      const signedUrl = await getSignedUrl(this.client, command, {
        expiresIn,
      })

      return signedUrl
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`R2 signed URL creation failed: ${message}`)
    }
  }

  async exists(path: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: path,
        })
      )
      return true
    } catch (error) {
      const errorName = error instanceof Error && 'name' in error ? (error as any).name : undefined
      if (errorName === 'NotFound' || errorName === 'NoSuchKey') {
        return false
      }
      const message = error instanceof Error ? error.message : String(error)
      this.logger.warn(`Error checking file existence for ${path}: ${message}`)
      return false
    }
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now()

    try {
      // Test 1: Try to list bucket contents (lightweight operation)
      const listResponse = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucketName,
          MaxKeys: 1,
        })
      )

      if (!listResponse) {
        return {
          success: false,
          message: `Failed to access R2 bucket '${this.bucketName}'`,
          error: 'No response from R2',
          responseTimeMs: Date.now() - startTime,
        }
      }

      // Test 2: Verify we can upload a test file
      const testPath = `.connection-test-${Date.now()}.txt`
      const testContent = Buffer.from('connection test')

      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: testPath,
          Body: testContent,
        })
      )

      // Clean up test file
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: testPath,
        })
      )

      const responseTime = Date.now() - startTime

      return {
        success: true,
        message: `Successfully connected to Cloudflare R2 (bucket: ${this.bucketName})`,
        responseTimeMs: responseTime,
      }
    } catch (error) {
      const errorName = error instanceof Error && 'name' in error ? (error as any).name : undefined
      let errorMessage = error instanceof Error ? error.message : String(error)

      // Provide more specific error messages for common issues
      if (errorName === 'NoSuchBucket') {
        errorMessage = `Bucket '${this.bucketName}' does not exist`
      } else if (errorName === 'InvalidAccessKeyId') {
        errorMessage = 'Invalid R2 access key ID'
      } else if (errorName === 'SignatureDoesNotMatch') {
        errorMessage = 'Invalid R2 secret access key'
      } else if (errorName === 'AccessDenied') {
        errorMessage = 'Access denied - check R2 API token permissions'
      }

      return {
        success: false,
        message: 'R2 connection test failed',
        error: errorMessage,
        responseTimeMs: Date.now() - startTime,
      }
    }
  }

  getProviderInfo() {
    return {
      provider: this.provider,
      bucketName: this.bucketName,
      endpoint: this.endpoint,
      region: 'auto',
    }
  }
}
