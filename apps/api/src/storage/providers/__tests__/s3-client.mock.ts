/**
 * Mock utilities for AWS SDK S3Client
 *
 * Provides test helpers for mocking S3 operations used by Cloudflare R2 and Backblaze B2 providers.
 */

import {
  HeadBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command
} from '@aws-sdk/client-s3'

/**
 * Creates a mock S3Client instance
 */
export const createMockS3Client = () => {
  return {
    send: jest.fn(),
  }
}

/**
 * Mock responses for successful S3 operations
 */
export const mockS3Responses = {
  /**
   * Successful HeadBucket response (bucket exists and is accessible)
   */
  headBucket: {
    $metadata: {
      httpStatusCode: 200,
      requestId: 'mock-request-id',
      extendedRequestId: 'mock-extended-request-id',
      attempts: 1,
      totalRetryDelay: 0,
    },
  },

  /**
   * Successful PutObject response
   */
  putObject: {
    $metadata: {
      httpStatusCode: 200,
      requestId: 'mock-request-id',
    },
    ETag: '"mock-etag-12345"',
  },

  /**
   * Successful GetObject response
   */
  getObject: {
    $metadata: {
      httpStatusCode: 200,
      requestId: 'mock-request-id',
    },
    Body: {
      // Make Body async iterable for R2/B2 providers
      async *[Symbol.asyncIterator]() {
        yield new Uint8Array([1, 2, 3])
      },
      transformToByteArray: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    },
    ContentType: 'application/octet-stream',
    ContentLength: 3,
  },

  /**
   * Successful DeleteObject response
   */
  deleteObject: {
    $metadata: {
      httpStatusCode: 204,
      requestId: 'mock-request-id',
    },
  },

  /**
   * Successful ListObjectsV2 response
   */
  listObjectsV2: {
    $metadata: {
      httpStatusCode: 200,
      requestId: 'mock-request-id',
    },
    Contents: [
      {
        Key: 'test-file-1.jpg',
        Size: 1024,
        LastModified: new Date('2024-01-01T00:00:00.000Z'),
      },
      {
        Key: 'test-file-2.jpg',
        Size: 2048,
        LastModified: new Date('2024-01-01T00:00:00.000Z'),
      },
    ],
    IsTruncated: false,
  },
}

/**
 * Mock errors for S3 operations
 */
export class MockS3Error extends Error {
  public $metadata: {
    httpStatusCode: number
    requestId?: string
  }

  constructor(message: string, statusCode: number = 500) {
    super(message)
    this.name = 'MockS3Error'
    this.$metadata = {
      httpStatusCode: statusCode,
      requestId: 'mock-error-request-id',
    }
  }
}

/**
 * Common S3 error scenarios
 */
export const mockS3Errors = {
  /**
   * Bucket not found (404)
   */
  bucketNotFound: () => new MockS3Error('The specified bucket does not exist', 404),

  /**
   * Access denied (403)
   */
  accessDenied: () => new MockS3Error('Access Denied', 403),

  /**
   * Invalid credentials (403)
   */
  invalidCredentials: () => new MockS3Error('The AWS Access Key Id you provided does not exist in our records', 403),

  /**
   * Network error
   */
  networkError: () => {
    const error: any = new Error('Network error')
    error.name = 'NetworkingError'
    error.$metadata = { httpStatusCode: 0 }
    return error
  },

  /**
   * Object not found (404)
   */
  objectNotFound: () => new MockS3Error('The specified key does not exist', 404),
}

/**
 * Helper to setup mock S3Client responses
 *
 * Note: This implementation preserves command.input for test assertions
 */
export const setupMockS3Client = (mockClient: any, scenarios: {
  headBucket?: 'success' | 'notFound' | 'accessDenied' | 'error'
  putObject?: 'success' | 'accessDenied' | 'error'
  getObject?: 'success' | 'notFound' | 'error'
  deleteObject?: 'success' | 'notFound' | 'error'
  listObjectsV2?: 'success' | 'notFound' | 'accessDenied' | 'error'
} = {}) => {
  mockClient.send.mockImplementation((command: any) => {
    if (command instanceof HeadBucketCommand) {
      switch (scenarios.headBucket) {
        case 'notFound':
          return Promise.reject(mockS3Errors.bucketNotFound())
        case 'accessDenied':
          return Promise.reject(mockS3Errors.accessDenied())
        case 'error':
          return Promise.reject(mockS3Errors.networkError())
        case 'success':
        default:
          return Promise.resolve(mockS3Responses.headBucket)
      }
    }

    if (command instanceof PutObjectCommand) {
      switch (scenarios.putObject) {
        case 'accessDenied':
          return Promise.reject(mockS3Errors.accessDenied())
        case 'error':
          return Promise.reject(mockS3Errors.networkError())
        case 'success':
        default:
          return Promise.resolve(mockS3Responses.putObject)
      }
    }

    if (command instanceof GetObjectCommand) {
      switch (scenarios.getObject) {
        case 'notFound':
          return Promise.reject(mockS3Errors.objectNotFound())
        case 'error':
          return Promise.reject(mockS3Errors.networkError())
        case 'success':
        default:
          return Promise.resolve(mockS3Responses.getObject)
      }
    }

    if (command instanceof DeleteObjectCommand) {
      switch (scenarios.deleteObject) {
        case 'notFound':
          return Promise.reject(mockS3Errors.objectNotFound())
        case 'error':
          return Promise.reject(mockS3Errors.networkError())
        case 'success':
        default:
          return Promise.resolve(mockS3Responses.deleteObject)
      }
    }

    if (command instanceof ListObjectsV2Command) {
      switch (scenarios.listObjectsV2) {
        case 'notFound':
          return Promise.reject(mockS3Errors.bucketNotFound())
        case 'accessDenied':
          return Promise.reject(mockS3Errors.accessDenied())
        case 'error':
          return Promise.reject(mockS3Errors.networkError())
        case 'success':
        default:
          return Promise.resolve(mockS3Responses.listObjectsV2)
      }
    }

    return Promise.reject(new Error(`Unmocked command: ${command.constructor.name}`))
  })
}
