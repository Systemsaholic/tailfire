/**
 * Unit Tests: Activity Media Batch Import
 *
 * Tests the batch import functionality for external URL images.
 * Covers:
 * - De-duplication by URL within batch
 * - Skipping already-existing URLs (idempotency)
 * - Partial success handling
 * - Error handling for invalid URLs
 * - Concurrency control
 */

import { Test, TestingModule } from '@nestjs/testing'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { ActivityMediaService, ActivityMediaDto } from '../activity-media.service'
import { DatabaseService } from '../../db/database.service'

// Mock database responses
const createMockMediaDto = (overrides: Partial<ActivityMediaDto> = {}): ActivityMediaDto => ({
  id: `media-${Date.now()}`,
  activityId: 'test-activity-id',
  entityType: 'cruise',
  mediaType: 'image',
  fileUrl: 'https://example.com/image.jpg',
  fileName: 'image.jpg',
  fileSize: null,
  caption: null,
  orderIndex: 0,
  uploadedAt: new Date().toISOString(),
  uploadedBy: null,
  attribution: null,
  ...overrides,
})

describe('ActivityMediaService - Batch Import', () => {
  let service: ActivityMediaService
  let mockDb: jest.Mocked<DatabaseService>
  let mockEventEmitter: jest.Mocked<EventEmitter2>

  // Track created media for assertions
  let createdMedia: ActivityMediaDto[] = []
  let existingUrls: Set<string> = new Set()

  beforeEach(async () => {
    createdMedia = []
    existingUrls = new Set()

    // Create mock database service
    mockDb = {
      client: {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        returning: jest.fn(),
      },
      schema: {
        activityMedia: { activityId: 'activityId', entityType: 'entityType', fileUrl: 'fileUrl', orderIndex: 'orderIndex' },
        itineraryActivities: { id: 'id', itineraryDayId: 'itineraryDayId', componentType: 'componentType' },
        itineraryDays: { id: 'id', itineraryId: 'itineraryId' },
        itineraries: { id: 'id', tripId: 'tripId' },
      },
    } as any

    mockEventEmitter = {
      emit: jest.fn(),
    } as any

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityMediaService,
        { provide: DatabaseService, useValue: mockDb },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile()

    service = module.get<ActivityMediaService>(ActivityMediaService)

    // Override methods that need mocking
    jest.spyOn(service, 'getExistingMediaUrls').mockImplementation(async () => existingUrls)
    jest.spyOn(service, 'create').mockImplementation(async (data) => {
      const media = createMockMediaDto({
        activityId: data.activityId,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        caption: data.caption ?? null,
        entityType: data.entityType || 'activity',
        attribution: data.attribution ?? null,
      })
      createdMedia.push(media)
      return media
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('importExternalImagesBatch', () => {
    const activityId = 'test-activity-id'
    const entityType = 'cruise' as const

    describe('successful imports', () => {
      it('should import all images when all are valid and new', async () => {
        const images = [
          { url: 'https://example.com/image1.jpg' },
          { url: 'https://example.com/image2.jpg' },
          { url: 'https://example.com/image3.jpg' },
        ]

        const result = await service.importExternalImagesBatch(activityId, images, entityType)

        expect(result.successful).toHaveLength(3)
        expect(result.failed).toHaveLength(0)
        expect(result.skipped).toBe(0)
        expect(createdMedia).toHaveLength(3)
      })

      it('should include caption and attribution when provided', async () => {
        const images = [
          {
            url: 'https://example.com/ship.jpg',
            caption: 'Beautiful ship at sunset',
            attribution: {
              source: 'traveltek',
              sourceUrl: 'https://traveltek.net/ships',
              photographerName: 'John Doe',
            },
          },
        ]

        const result = await service.importExternalImagesBatch(activityId, images, entityType)

        expect(result.successful).toHaveLength(1)
        expect(createdMedia[0]?.caption).toBe('Beautiful ship at sunset')
        expect(createdMedia[0]?.attribution).toEqual({
          source: 'traveltek',
          sourceUrl: 'https://traveltek.net/ships',
          photographerName: 'John Doe',
        })
      })

      it('should extract filename from URL', async () => {
        const images = [
          { url: 'https://cdn.example.com/ships/royal-caribbean/wonder-of-seas.jpg' },
        ]

        await service.importExternalImagesBatch(activityId, images, entityType)

        expect(createdMedia[0]?.fileName).toBe('wonder-of-seas.jpg')
      })
    })

    describe('de-duplication', () => {
      it('should de-duplicate images by URL within the same batch', async () => {
        const images = [
          { url: 'https://example.com/image1.jpg' },
          { url: 'https://example.com/image1.jpg' }, // duplicate
          { url: 'https://example.com/image2.jpg' },
          { url: 'https://example.com/image1.jpg' }, // another duplicate
        ]

        const result = await service.importExternalImagesBatch(activityId, images, entityType)

        expect(result.successful).toHaveLength(2) // Only 2 unique URLs
        expect(result.skipped).toBe(2) // 2 duplicates skipped
        expect(createdMedia).toHaveLength(2)
      })

      it('should skip images that already exist in the database', async () => {
        // Set up existing URLs
        existingUrls = new Set([
          'https://example.com/existing1.jpg',
          'https://example.com/existing2.jpg',
        ])

        const images = [
          { url: 'https://example.com/existing1.jpg' }, // already in DB
          { url: 'https://example.com/new1.jpg' },
          { url: 'https://example.com/existing2.jpg' }, // already in DB
          { url: 'https://example.com/new2.jpg' },
        ]

        const result = await service.importExternalImagesBatch(activityId, images, entityType)

        expect(result.successful).toHaveLength(2) // Only 2 new URLs
        expect(result.skipped).toBe(2) // 2 existing skipped
        expect(createdMedia).toHaveLength(2)
        expect(createdMedia.map(m => m.fileUrl)).toEqual([
          'https://example.com/new1.jpg',
          'https://example.com/new2.jpg',
        ])
      })

      it('should handle combination of duplicates and existing URLs', async () => {
        existingUrls = new Set(['https://example.com/existing.jpg'])

        const images = [
          { url: 'https://example.com/existing.jpg' }, // in DB
          { url: 'https://example.com/new.jpg' },
          { url: 'https://example.com/new.jpg' }, // duplicate
          { url: 'https://example.com/existing.jpg' }, // in DB and duplicate
        ]

        const result = await service.importExternalImagesBatch(activityId, images, entityType)

        expect(result.successful).toHaveLength(1)
        expect(result.skipped).toBe(3) // 2 duplicates + 1 existing
      })
    })

    describe('error handling', () => {
      it('should handle invalid URL format', async () => {
        // Make create throw for invalid URLs
        jest.spyOn(service, 'create').mockImplementation(async (data) => {
          if (data.fileUrl === 'not-a-valid-url') {
            throw new Error('Invalid URL format')
          }
          const media = createMockMediaDto({
            activityId: data.activityId,
            fileUrl: data.fileUrl,
          })
          createdMedia.push(media)
          return media
        })

        const images = [
          { url: 'https://example.com/valid.jpg' },
          { url: 'not-a-valid-url' },
        ]

        const result = await service.importExternalImagesBatch(activityId, images, entityType)

        expect(result.successful).toHaveLength(1)
        expect(result.failed).toHaveLength(1)
        expect(result.failed[0]?.url).toBe('not-a-valid-url')
        expect(result.failed[0]?.error).toBe('Invalid URL format')
      })

      it('should continue processing after individual failures', async () => {
        let callCount = 0
        jest.spyOn(service, 'create').mockImplementation(async (data) => {
          callCount++
          // Fail on second call
          if (callCount === 2) {
            throw new Error('Database error')
          }
          const media = createMockMediaDto({
            activityId: data.activityId,
            fileUrl: data.fileUrl,
          })
          createdMedia.push(media)
          return media
        })

        const images = [
          { url: 'https://example.com/image1.jpg' },
          { url: 'https://example.com/image2.jpg' }, // This will fail
          { url: 'https://example.com/image3.jpg' },
        ]

        const result = await service.importExternalImagesBatch(activityId, images, entityType)

        expect(result.successful).toHaveLength(2)
        expect(result.failed).toHaveLength(1)
        expect(result.failed[0]?.url).toBe('https://example.com/image2.jpg')
      })

      it('should return empty successful array when all fail', async () => {
        jest.spyOn(service, 'create').mockRejectedValue(new Error('All failed'))

        const images = [
          { url: 'https://example.com/image1.jpg' },
          { url: 'https://example.com/image2.jpg' },
        ]

        const result = await service.importExternalImagesBatch(activityId, images, entityType)

        expect(result.successful).toHaveLength(0)
        expect(result.failed).toHaveLength(2)
      })
    })

    describe('edge cases', () => {
      it('should handle empty images array', async () => {
        const result = await service.importExternalImagesBatch(activityId, [], entityType)

        expect(result.successful).toHaveLength(0)
        expect(result.failed).toHaveLength(0)
        expect(result.skipped).toBe(0)
        expect(service.create).not.toHaveBeenCalled()
      })

      it('should handle single image', async () => {
        const images = [{ url: 'https://example.com/single.jpg' }]

        const result = await service.importExternalImagesBatch(activityId, images, entityType)

        expect(result.successful).toHaveLength(1)
        expect(result.failed).toHaveLength(0)
      })

      it('should handle URL with no filename (use default)', async () => {
        const images = [{ url: 'https://example.com/' }]

        await service.importExternalImagesBatch(activityId, images, entityType)

        // The service should use a default filename
        expect(createdMedia[0]?.fileName).toBeTruthy()
      })

      it('should handle different entity types', async () => {
        const images = [{ url: 'https://example.com/image.jpg' }]

        await service.importExternalImagesBatch(activityId, images, 'activity')

        expect(createdMedia[0]?.entityType).toBe('activity')
      })
    })

    describe('concurrency', () => {
      it('should process images with controlled concurrency', async () => {
        const processingOrder: number[] = []
        let concurrentCount = 0
        let maxConcurrent = 0

        jest.spyOn(service, 'create').mockImplementation(async (data) => {
          concurrentCount++
          maxConcurrent = Math.max(maxConcurrent, concurrentCount)

          // Simulate async work
          await new Promise(resolve => setTimeout(resolve, 10))

          concurrentCount--
          processingOrder.push(parseInt(data.fileUrl.split('image')[1]?.split('.')[0] ?? '0'))

          return createMockMediaDto({
            activityId: data.activityId,
            fileUrl: data.fileUrl,
          })
        })

        const images = Array.from({ length: 10 }, (_, i) => ({
          url: `https://example.com/image${i}.jpg`,
        }))

        await service.importExternalImagesBatch(activityId, images, entityType)

        // Max concurrent should be limited to 3 (the concurrency limit)
        expect(maxConcurrent).toBeLessThanOrEqual(3)
        // All images should be processed
        expect(processingOrder).toHaveLength(10)
      })
    })
  })

  describe('getExistingMediaUrls', () => {
    it('should return set of existing URLs', async () => {
      // Restore the original implementation for this test
      jest.spyOn(service, 'getExistingMediaUrls').mockRestore()

      // Mock the database query
      const mockMedia = [
        { fileUrl: 'https://example.com/existing1.jpg' },
        { fileUrl: 'https://example.com/existing2.jpg' },
      ]

      mockDb.client.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockMedia),
        }),
      }) as any

      const result = await service.getExistingMediaUrls('test-activity', 'cruise')

      expect(result).toBeInstanceOf(Set)
      expect(result.size).toBe(2)
      expect(result.has('https://example.com/existing1.jpg')).toBe(true)
      expect(result.has('https://example.com/existing2.jpg')).toBe(true)
    })

    it('should return empty set when no existing media', async () => {
      jest.spyOn(service, 'getExistingMediaUrls').mockRestore()

      mockDb.client.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      }) as any

      const result = await service.getExistingMediaUrls('test-activity', 'cruise')

      expect(result).toBeInstanceOf(Set)
      expect(result.size).toBe(0)
    })
  })
})

describe('processWithConcurrency (internal method)', () => {
  // Test the concurrency helper indirectly through importExternalImagesBatch
  it('should maintain order of results despite concurrent processing', async () => {
    const mockDb = {
      client: {},
      schema: {
        activityMedia: {},
        itineraryActivities: {},
        itineraryDays: {},
        itineraries: {},
      },
    } as any

    const mockEventEmitter = { emit: jest.fn() } as any

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityMediaService,
        { provide: DatabaseService, useValue: mockDb },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile()

    const service = module.get<ActivityMediaService>(ActivityMediaService)

    // Set up mocks
    jest.spyOn(service, 'getExistingMediaUrls').mockResolvedValue(new Set())

    const createdMedia: ActivityMediaDto[] = []
    jest.spyOn(service, 'create').mockImplementation(async (data) => {
      // Random delay to simulate async processing
      await new Promise(resolve => setTimeout(resolve, Math.random() * 50))
      const media = createMockMediaDto({
        activityId: data.activityId,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
      })
      createdMedia.push(media)
      return media
    })

    const images = [
      { url: 'https://example.com/image0.jpg' },
      { url: 'https://example.com/image1.jpg' },
      { url: 'https://example.com/image2.jpg' },
      { url: 'https://example.com/image3.jpg' },
      { url: 'https://example.com/image4.jpg' },
    ]

    const result = await service.importExternalImagesBatch('test-activity', images, 'cruise')

    // Results should match input order (index 0 -> 0, 1 -> 1, etc.)
    expect(result.successful).toHaveLength(5)
    for (let i = 0; i < 5; i++) {
      expect(result.successful[i]?.url).toBe(`https://example.com/image${i}.jpg`)
    }
  })
})
