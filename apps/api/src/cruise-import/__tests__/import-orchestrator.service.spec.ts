/**
 * Import Orchestrator Service Integration Tests
 *
 * Tests:
 * - Dry-run mode (no DB writes)
 * - Skip oversized files
 * - Handle malformed JSON without aborting batch
 * - Handle missing required fields
 * - Retry/backoff behavior
 * - Metrics tracking
 */

import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { ImportOrchestratorService } from '../services/import-orchestrator.service'
import { TraveltekFtpService } from '../services/traveltek-ftp.service'
import { SailingImportService } from '../services/sailing-import.service'
import { ReferenceDataCacheService } from '../services/reference-data-cache.service'
import { DatabaseService } from '../../db/database.service'
import { FtpFileInfo } from '../cruise-import.types'

// Mock FTP Service
const mockFtpService = {
  listSailingFiles: jest.fn(),
  downloadFile: jest.fn(),
  downloadFilePooled: jest.fn(),
  disconnect: jest.fn(),
  testConnection: jest.fn(),
  getConnectionInfo: jest.fn(),
  extractSailingIdFromPath: jest.fn((path: string) => path.split('/').pop()?.replace('.json', '') || ''),
  extractIdsFromPath: jest.fn(() => ({ codetocruiseid: 'SAIL-001', cruiselineid: 'TCL', shipid: 'TS' })),
  forceReconnect: jest.fn(),
  initializePool: jest.fn(),
  isPoolInitialized: jest.fn().mockReturnValue(false),
}

// Mock Sailing Import Service
const mockSailingImporter = {
  upsertSailing: jest.fn(),
  resetStubsCreated: jest.fn(),
  getStubsCreated: jest.fn().mockReturnValue({ cruiseLines: 0, ships: 0, ports: 0, regions: 0 }),
  logStubReport: jest.fn(),
}

// Mock Cache Service
const mockCacheService = {
  resetStats: jest.fn(),
  logStats: jest.fn(),
}

// Mock Database Service
const mockDbService = {
  db: {
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue(Promise.resolve([])),
    }),
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([{ id: 'test-sync-id' }]),
        onConflictDoUpdate: jest.fn().mockResolvedValue(undefined),
      }),
    }),
    update: jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      }),
    }),
    execute: jest.fn().mockResolvedValue([{ acquired: true }]),
  },
}

// Mock Config Service
const mockConfigService = {
  get: jest.fn(),
}

describe('ImportOrchestratorService', () => {
  let service: ImportOrchestratorService

  beforeEach(async () => {
    jest.clearAllMocks()

    // Default config mock to simulate production environment (passes environment guard)
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'API_URL') return 'https://api.tailfire.ca'
      if (key === 'BYPASS_SYNC_ENVIRONMENT_GUARD') return 'false'
      if (key === 'ENABLE_SCHEDULED_CRUISE_SYNC') return 'false' // Disabled by default
      return undefined
    })

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportOrchestratorService,
        { provide: TraveltekFtpService, useValue: mockFtpService },
        { provide: SailingImportService, useValue: mockSailingImporter },
        { provide: ReferenceDataCacheService, useValue: mockCacheService },
        { provide: DatabaseService, useValue: mockDbService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile()

    service = module.get<ImportOrchestratorService>(ImportOrchestratorService)
  })

  describe('runSync', () => {
    const mockFiles: FtpFileInfo[] = [
      { path: '/2025/06/TCL/TS/sailing1.json', name: 'sailing1.json', size: 1000 },
      { path: '/2025/06/TCL/TS/sailing2.json', name: 'sailing2.json', size: 2000 },
    ]

    it('should run dry-run without processing files', async () => {
      mockFtpService.listSailingFiles.mockResolvedValue(mockFiles)

      const metrics = await service.runSync({ dryRun: true })

      expect(mockFtpService.listSailingFiles).toHaveBeenCalled()
      expect(mockFtpService.downloadFile).not.toHaveBeenCalled()
      expect(mockSailingImporter.upsertSailing).not.toHaveBeenCalled()
      expect(metrics.filesProcessed).toBe(0)
    })

    it('should skip oversized files', async () => {
      const filesWithOversized: FtpFileInfo[] = [
        { path: '/2025/06/TCL/TS/sailing1.json', name: 'sailing1.json', size: 100 },
        { path: '/2025/06/TCL/TS/large.json', name: 'large.json', size: 999999 }, // Oversized
      ]

      mockFtpService.listSailingFiles.mockResolvedValue(filesWithOversized)
      mockFtpService.downloadFile.mockImplementation((path: string) => {
        if (path.includes('large')) return null // Should be skipped before download
        return Promise.resolve({
          content: JSON.stringify({
            codetocruiseid: 'SAIL-001',
            cruiselineid: 'TCL',
            cruiselinename: 'Test Line',
            shipid: 'TS',
            shipname: 'Test Ship',
            cruisename: 'Test Cruise',
            saildate: '2025-06-15',
            nights: 7,
            embarkport: 'Miami',
            embarkportid: 'MIA',
            disembarkport: 'Miami',
            disembarkportid: 'MIA',
          }),
          size: 100,
        })
      })
      mockSailingImporter.upsertSailing.mockResolvedValue(true)

      const metrics = await service.runSync({ maxFileSizeBytes: 500000 })

      expect(metrics.filesSkipped).toBe(1)
      expect(metrics.skipReasons.oversized).toBe(1)
      expect(metrics.filesProcessed).toBe(1)
    })

    it('should handle malformed JSON without aborting batch', async () => {
      const files: FtpFileInfo[] = [
        { path: '/2025/06/TCL/TS/good.json', name: 'good.json', size: 100 },
        { path: '/2025/06/TCL/TS/bad.json', name: 'bad.json', size: 100 },
        { path: '/2025/06/TCL/TS/good2.json', name: 'good2.json', size: 100 },
      ]

      mockFtpService.listSailingFiles.mockResolvedValue(files)
      mockFtpService.downloadFile.mockImplementation((path: string) => {
        if (path.includes('bad')) {
          return Promise.resolve({ content: 'not valid json {{{', size: 100 })
        }
        return Promise.resolve({
          content: JSON.stringify({
            codetocruiseid: `SAIL-${path.split('/').pop()}`,
            cruiselineid: 'TCL',
            cruiselinename: 'Test Line',
            shipid: 'TS',
            shipname: 'Test Ship',
            cruisename: 'Test Cruise',
            saildate: '2025-06-15',
            nights: 7,
            embarkport: 'Miami',
            embarkportid: 'MIA',
            disembarkport: 'Miami',
            disembarkportid: 'MIA',
          }),
          size: 100,
        })
      })
      mockSailingImporter.upsertSailing.mockResolvedValue(true)

      const metrics = await service.runSync({})

      // Batch should not be aborted - 2 files should succeed, 1 should fail
      expect(metrics.filesProcessed).toBe(2)
      expect(metrics.filesFailed).toBe(1)
      expect(metrics.skipReasons.parseError).toBe(1)
      expect(metrics.errors.length).toBe(1)
      expect(metrics.errors[0]?.error).toContain('JSON parse error')
    })

    it('should handle files with missing required fields', async () => {
      const files: FtpFileInfo[] = [
        { path: '/2025/06/TCL/TS/incomplete.json', name: 'incomplete.json', size: 100 },
      ]

      mockFtpService.listSailingFiles.mockResolvedValue(files)
      mockFtpService.downloadFile.mockResolvedValue({
        content: JSON.stringify({
          cruisename: 'Test Cruise',
          // Missing: codetocruiseid, shipid, cruiselineid
        }),
        size: 100,
      })

      const metrics = await service.runSync({})

      expect(metrics.filesFailed).toBe(1)
      expect(metrics.skipReasons.missingFields).toBe(1)
      expect(metrics.errors[0]?.error).toContain('Missing required fields')
    })

    it('should handle download failures gracefully', async () => {
      const files: FtpFileInfo[] = [
        { path: '/2025/06/TCL/TS/fail.json', name: 'fail.json', size: 100 },
      ]

      mockFtpService.listSailingFiles.mockResolvedValue(files)
      mockFtpService.downloadFile.mockResolvedValue(null) // Download failed

      const metrics = await service.runSync({})

      expect(metrics.filesFailed).toBe(1)
      expect(metrics.skipReasons.downloadFailed).toBe(1)
    })

    it('should track metrics correctly', async () => {
      mockFtpService.listSailingFiles.mockResolvedValue(mockFiles)
      mockFtpService.downloadFile.mockResolvedValue({
        content: JSON.stringify({
          codetocruiseid: 'SAIL-001',
          cruiselineid: 'TCL',
          cruiselinename: 'Test Line',
          shipid: 'TS',
          shipname: 'Test Ship',
          cruisename: 'Test Cruise',
          saildate: '2025-06-15',
          nights: 7,
          embarkport: 'Miami',
          embarkportid: 'MIA',
          disembarkport: 'Miami',
          disembarkportid: 'MIA',
          prices: [
            { cabincode: 'IA', cabincategory: 'Inside', baseprice: 1000, taxes: 100 },
          ],
          itinerary: [
            { daynumber: 1, portname: 'Miami', portid: 'MIA' },
            { daynumber: 2, portname: 'At Sea', isseaday: true },
          ],
        }),
        size: 500,
      })
      mockSailingImporter.upsertSailing.mockResolvedValue(true)

      const metrics = await service.runSync({})

      expect(metrics.filesProcessed).toBe(2)
      expect(metrics.sailingsCreated).toBe(2)
      expect(metrics.pricesInserted).toBe(2) // 1 price × 2 files
      expect(metrics.stopsInserted).toBe(4) // 2 stops × 2 files
      expect(metrics.startedAt).toBeDefined()
      expect(metrics.completedAt).toBeDefined()
      expect(metrics.durationMs).toBeGreaterThanOrEqual(0)
    })

    it('should prevent concurrent sync runs', async () => {
      mockFtpService.listSailingFiles.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
      )

      // Start first sync
      const firstSync = service.runSync({ dryRun: true })

      // Try to start second sync immediately
      await expect(service.runSync({ dryRun: true })).rejects.toThrow('Sync already in progress')

      // Wait for first to complete
      await firstSync
    })

    it('should report sync in progress status correctly', async () => {
      expect(service.isSyncInProgress()).toBe(false)

      mockFtpService.listSailingFiles.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 50))
      )

      const syncPromise = service.runSync({ dryRun: true })
      expect(service.isSyncInProgress()).toBe(true)

      await syncPromise
      expect(service.isSyncInProgress()).toBe(false)
    })
  })

  describe('testConnection', () => {
    it('should return success when FTP connection works', async () => {
      mockFtpService.testConnection.mockResolvedValue(true)
      mockFtpService.getConnectionInfo.mockReturnValue({
        host: 'ftp.test.com',
        user: 'testuser',
        connected: true,
      })

      const result = await service.testConnection()

      expect(result.success).toBe(true)
      expect(result.info.connected).toBe(true)
    })

    it('should return failure when FTP connection fails', async () => {
      mockFtpService.testConnection.mockRejectedValue(new Error('Connection refused'))
      mockFtpService.getConnectionInfo.mockReturnValue({
        host: 'ftp.test.com',
        user: 'testuser',
        connected: false,
      })

      const result = await service.testConnection()

      expect(result.success).toBe(false)
      expect(result.info.error).toContain('Connection refused')
    })
  })

  describe('scheduledSync retry behavior', () => {
    beforeEach(() => {
      // Enable scheduled sync
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'ENABLE_SCHEDULED_CRUISE_SYNC') return 'true'
        if (key === 'API_URL') return 'https://api.tailfire.ca' // Production URL
        if (key === 'BYPASS_SYNC_ENVIRONMENT_GUARD') return 'false'
        return undefined
      })

      // Reset mocks
      mockDbService.db.execute.mockResolvedValue([{ acquired: true }])
    })

    it('should identify retryable connection errors', () => {
      // Access private method via type assertion for testing
      const service_any = service as any

      // Retryable errors (connection/network issues)
      expect(service_any.isRetryableError(new Error('ECONNREFUSED'))).toBe(true)
      expect(service_any.isRetryableError(new Error('Connection timeout'))).toBe(true)
      expect(service_any.isRetryableError(new Error('FTP server unavailable'))).toBe(true)
      expect(service_any.isRetryableError(new Error('Network unreachable'))).toBe(true)
      expect(service_any.isRetryableError(new Error('Socket closed'))).toBe(true)
      expect(service_any.isRetryableError(new Error('ENOTFOUND'))).toBe(true)

      // Non-retryable errors
      expect(service_any.isRetryableError(new Error('Invalid JSON'))).toBe(false)
      expect(service_any.isRetryableError(new Error('Missing required field'))).toBe(false)
      expect(service_any.isRetryableError(new Error('Authentication failed'))).toBe(false)
    })

    it('should not run if scheduled sync is disabled', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'ENABLE_SCHEDULED_CRUISE_SYNC') return 'false'
        return undefined
      })

      await service.scheduledSync()

      expect(mockFtpService.listSailingFiles).not.toHaveBeenCalled()
    })

    it('should skip if another instance holds the lock', async () => {
      mockDbService.db.execute.mockResolvedValue([{ acquired: false }])

      await service.scheduledSync()

      expect(mockFtpService.listSailingFiles).not.toHaveBeenCalled()
    })

    it('should succeed on first attempt without retrying', async () => {
      mockFtpService.listSailingFiles.mockResolvedValue([])

      await service.scheduledSync()

      expect(mockFtpService.listSailingFiles).toHaveBeenCalledTimes(1)
    })

    it('should retry on retryable error and succeed on second attempt', async () => {
      // Mock sleep to avoid waiting in tests
      const originalSleep = (service as any).sleep
      ;(service as any).sleep = jest.fn().mockResolvedValue(undefined)

      // First call fails with connection error, second succeeds
      mockFtpService.listSailingFiles
        .mockRejectedValueOnce(new Error('ECONNREFUSED'))
        .mockResolvedValueOnce([])
      mockFtpService.forceReconnect.mockResolvedValue(undefined)

      await service.scheduledSync()

      expect(mockFtpService.forceReconnect).toHaveBeenCalledTimes(2)
      expect((service as any).sleep).toHaveBeenCalledTimes(1)
      // First delay should be 5 minutes (300000ms)
      expect((service as any).sleep).toHaveBeenCalledWith(300000)

      // Restore original sleep
      ;(service as any).sleep = originalSleep
    })

    it('should not retry on non-retryable error', async () => {
      // Mock sleep to ensure it's not called
      const sleepMock = jest.fn().mockResolvedValue(undefined)
      ;(service as any).sleep = sleepMock

      // Fail with a non-retryable error (environment guard)
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'ENABLE_SCHEDULED_CRUISE_SYNC') return 'true'
        if (key === 'API_URL') return 'https://api.tailfire.ca'
        if (key === 'BYPASS_SYNC_ENVIRONMENT_GUARD') return 'false'
        return undefined
      })

      mockFtpService.forceReconnect.mockResolvedValue(undefined)
      mockFtpService.listSailingFiles.mockRejectedValue(new Error('Invalid authentication'))

      await service.scheduledSync()

      // Should not retry for auth errors
      expect(sleepMock).not.toHaveBeenCalled()
      expect(mockFtpService.forceReconnect).toHaveBeenCalledTimes(1)
    })

    it('should give up after max retries', async () => {
      // Mock sleep to avoid waiting
      const sleepMock = jest.fn().mockResolvedValue(undefined)
      ;(service as any).sleep = sleepMock

      // All attempts fail with retryable error
      mockFtpService.forceReconnect.mockResolvedValue(undefined)
      mockFtpService.listSailingFiles.mockRejectedValue(new Error('Connection timeout'))

      await service.scheduledSync()

      // Should try 3 times total (initial + 2 retries)
      expect(mockFtpService.forceReconnect).toHaveBeenCalledTimes(3)
      // Should have 2 sleep calls (between attempts 1-2 and 2-3)
      expect(sleepMock).toHaveBeenCalledTimes(2)
      // Verify exponential backoff: 5min, 10min
      expect(sleepMock).toHaveBeenNthCalledWith(1, 300000) // 5 minutes
      expect(sleepMock).toHaveBeenNthCalledWith(2, 600000) // 10 minutes
    })
  })
})
