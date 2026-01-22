/**
 * Backblaze B2 Storage Provider
 *
 * Implementation of StorageProvider for Backblaze B2.
 * Uses the AWS SDK S3 client since B2 is S3-compatible.
 *
 * Backblaze B2 Benefits:
 * - Very low storage costs ($6/TB/month)
 * - S3-compatible API
 * - Free egress up to 3x storage amount
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
import { ApiProvider, BackblazeB2Credentials } from '@tailfire/shared-types'
import {
  StorageProvider,
  UploadOptions,
  FileMetadata,
  ConnectionTestResult,
} from './storage-provider.interface'

export class BackblazeB2Provider implements StorageProvider {
  readonly provider = ApiProvider.BACKBLAZE_B2
  private readonly logger = new Logger(BackblazeB2Provider.name)
  private client: S3Client
  private readonly publicUrl?: string

  constructor(
    credentials: BackblazeB2Credentials,
    private readonly bucketName: string,
    publicUrl?: string
  ) {
    this.publicUrl = publicUrl

    // Extract region from endpoint if not provided
    // Endpoint format: s3.us-west-004.backblazeb2.com
    const region = credentials.region ||
      credentials.endpoint.match(/s3\.([a-z]+-[a-z]+-\d{3})/)?.[1] ||
      'us-west-004'

    this.client = new S3Client({
      region,
      endpoint: `https://${credentials.endpoint}`,
      credentials: {
        accessKeyId: credentials.keyId,
        secretAccessKey: credentials.applicationKey,
      },
    })

    this.logger.log(`Initialized Backblaze B2 provider (bucket: ${bucketName}, region: ${region}${publicUrl ? `, publicUrl: ${publicUrl}` : ''})`)
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
      throw new Error(`B2 upload failed: ${message}`)
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
      throw new Error(`B2 download failed: ${message}`)
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
      throw new Error(`B2 delete failed: ${message}`)
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
      throw new Error(`B2 batch delete failed: ${message}`)
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
        contentType: undefined, // B2 doesn't return ContentType in list
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`B2 list failed: ${message}`)
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
      throw new Error(`B2 signed URL creation failed: ${message}`)
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
          message: `Failed to access B2 bucket '${this.bucketName}'`,
          error: 'No response from B2',
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
        message: `Successfully connected to Backblaze B2 (bucket: ${this.bucketName})`,
        responseTimeMs: responseTime,
      }
    } catch (error) {
      const errorName = error instanceof Error && 'name' in error ? (error as any).name : undefined
      let errorMessage = error instanceof Error ? error.message : String(error)

      // Provide more specific error messages for common issues
      if (errorName === 'NoSuchBucket') {
        errorMessage = `Bucket '${this.bucketName}' does not exist`
      } else if (errorName === 'InvalidAccessKeyId') {
        errorMessage = 'Invalid B2 key ID'
      } else if (errorName === 'SignatureDoesNotMatch') {
        errorMessage = 'Invalid B2 application key'
      } else if (errorName === 'AccessDenied') {
        errorMessage = 'Access denied - check B2 application key permissions'
      }

      return {
        success: false,
        message: 'B2 connection test failed',
        error: errorMessage,
        responseTimeMs: Date.now() - startTime,
      }
    }
  }

  getProviderInfo() {
    return {
      provider: this.provider,
      bucketName: this.bucketName,
    }
  }

  getPublicUrl(path: string): string | undefined {
    if (!this.publicUrl) {
      return undefined
    }
    // B2 public URL format: {publicUrl}/{path}
    return `${this.publicUrl}/${path}`
  }
}
