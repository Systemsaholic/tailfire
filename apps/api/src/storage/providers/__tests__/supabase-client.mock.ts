/**
 * Mock utilities for Supabase client
 *
 * Provides test helpers for mocking Supabase Storage operations.
 */

/**
 * Creates a mock Supabase Storage client
 */
export const createMockSupabaseClient = () => {
  const mockStorage = {
    from: jest.fn().mockReturnThis(),
    upload: jest.fn(),
    download: jest.fn(),
    remove: jest.fn(),
    getPublicUrl: jest.fn(),
    createSignedUrl: jest.fn(),
    list: jest.fn(),
  }

  return {
    storage: mockStorage,
  }
}

/**
 * Mock responses for successful Supabase operations
 */
export const mockSupabaseResponses = {
  /**
   * Successful upload response
   */
  upload: {
    data: {
      path: 'mock-path/test-file.jpg',
      id: 'mock-file-id',
      fullPath: 'bucket/mock-path/test-file.jpg',
    },
    error: null,
  },

  /**
   * Successful download response
   */
  download: {
    data: new Blob([new Uint8Array([1, 2, 3])], { type: 'application/octet-stream' }),
    error: null,
  },

  /**
   * Successful delete response
   */
  remove: {
    data: [
      {
        name: 'test-file.jpg',
      },
    ],
    error: null,
  },

  /**
   * Successful public URL response
   */
  getPublicUrl: {
    data: {
      publicUrl: 'https://example.supabase.co/storage/v1/object/public/bucket/mock-path/test-file.jpg',
    },
  },

  /**
   * Successful signed URL response
   */
  createSignedUrl: {
    data: {
      signedUrl: 'https://example.supabase.co/storage/v1/object/sign/bucket/mock-path/test-file.jpg?token=mock-token',
    },
    error: null,
  },

  /**
   * Successful list response
   */
  list: {
    data: [
      {
        name: 'test-file-1.jpg',
        id: 'mock-id-1',
        updated_at: '2024-01-01T00:00:00.000Z',
        created_at: '2024-01-01T00:00:00.000Z',
        last_accessed_at: '2024-01-01T00:00:00.000Z',
        metadata: {
          size: 1024,
          mimetype: 'image/jpeg',
          cacheControl: 'public, max-age=3600',
        },
      },
      {
        name: 'test-file-2.jpg',
        id: 'mock-id-2',
        updated_at: '2024-01-01T00:00:00.000Z',
        created_at: '2024-01-01T00:00:00.000Z',
        last_accessed_at: '2024-01-01T00:00:00.000Z',
        metadata: {
          size: 2048,
          mimetype: 'image/jpeg',
          cacheControl: 'public, max-age=3600',
        },
      },
    ],
    error: null,
  },
}

/**
 * Mock errors for Supabase operations
 */
export const mockSupabaseErrors = {
  /**
   * Bucket not found
   */
  bucketNotFound: () => ({
    data: null,
    error: {
      message: 'Bucket not found',
      statusCode: '404',
    },
  }),

  /**
   * Access denied
   */
  accessDenied: () => ({
    data: null,
    error: {
      message: 'Access denied',
      statusCode: '403',
    },
  }),

  /**
   * Invalid credentials
   */
  invalidCredentials: () => ({
    data: null,
    error: {
      message: 'Invalid API key',
      statusCode: '401',
    },
  }),

  /**
   * File not found
   */
  fileNotFound: () => ({
    data: null,
    error: {
      message: 'Object not found',
      statusCode: '404',
    },
  }),

  /**
   * Upload failed
   */
  uploadFailed: () => ({
    data: null,
    error: {
      message: 'Failed to upload file',
      statusCode: '500',
    },
  }),

  /**
   * Network error
   */
  networkError: () => ({
    data: null,
    error: {
      message: 'Network error',
      statusCode: '0',
    },
  }),
}

/**
 * Helper to setup mock Supabase client responses
 */
export const setupMockSupabaseClient = (mockClient: any, scenarios: {
  upload?: 'success' | 'bucketNotFound' | 'accessDenied' | 'uploadFailed'
  download?: 'success' | 'fileNotFound' | 'accessDenied'
  remove?: 'success' | 'fileNotFound' | 'accessDenied'
  getPublicUrl?: 'success'
  createSignedUrl?: 'success' | 'fileNotFound' | 'accessDenied'
  list?: 'success' | 'bucketNotFound' | 'accessDenied'
} = {}) => {
  const storage = mockClient.storage

  // Upload
  if (scenarios.upload) {
    switch (scenarios.upload) {
      case 'bucketNotFound':
        storage.upload.mockResolvedValue(mockSupabaseErrors.bucketNotFound())
        break
      case 'accessDenied':
        storage.upload.mockResolvedValue(mockSupabaseErrors.accessDenied())
        break
      case 'uploadFailed':
        storage.upload.mockResolvedValue(mockSupabaseErrors.uploadFailed())
        break
      case 'success':
      default:
        storage.upload.mockResolvedValue(mockSupabaseResponses.upload)
    }
  }

  // Download
  if (scenarios.download) {
    switch (scenarios.download) {
      case 'fileNotFound':
        storage.download.mockResolvedValue(mockSupabaseErrors.fileNotFound())
        break
      case 'accessDenied':
        storage.download.mockResolvedValue(mockSupabaseErrors.accessDenied())
        break
      case 'success':
      default:
        storage.download.mockResolvedValue(mockSupabaseResponses.download)
    }
  }

  // Remove
  if (scenarios.remove) {
    switch (scenarios.remove) {
      case 'fileNotFound':
        storage.remove.mockResolvedValue(mockSupabaseErrors.fileNotFound())
        break
      case 'accessDenied':
        storage.remove.mockResolvedValue(mockSupabaseErrors.accessDenied())
        break
      case 'success':
      default:
        storage.remove.mockResolvedValue(mockSupabaseResponses.remove)
    }
  }

  // Get Public URL (always succeeds, doesn't make API call)
  if (scenarios.getPublicUrl) {
    storage.getPublicUrl.mockReturnValue(mockSupabaseResponses.getPublicUrl)
  }

  // Create Signed URL
  if (scenarios.createSignedUrl) {
    switch (scenarios.createSignedUrl) {
      case 'fileNotFound':
        storage.createSignedUrl.mockResolvedValue(mockSupabaseErrors.fileNotFound())
        break
      case 'accessDenied':
        storage.createSignedUrl.mockResolvedValue(mockSupabaseErrors.accessDenied())
        break
      case 'success':
      default:
        storage.createSignedUrl.mockResolvedValue(mockSupabaseResponses.createSignedUrl)
    }
  }

  // List
  if (scenarios.list) {
    switch (scenarios.list) {
      case 'bucketNotFound':
        storage.list.mockResolvedValue(mockSupabaseErrors.bucketNotFound())
        break
      case 'accessDenied':
        storage.list.mockResolvedValue(mockSupabaseErrors.accessDenied())
        break
      case 'success':
      default:
        storage.list.mockResolvedValue(mockSupabaseResponses.list)
    }
  }
}
