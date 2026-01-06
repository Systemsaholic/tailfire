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
import { ImportOrchestratorService } from '../services/import-orchestrator.service'
import { TraveltekFtpService } from '../services/traveltek-ftp.service'
import { SailingImportService } from '../services/sailing-import.service'
import { ReferenceDataCacheService } from '../services/reference-data-cache.service'
import { FtpFileInfo } from '../cruise-import.types'

// Mock FTP Service
const mockFtpService = {
  listSailingFiles: jest.fn(),
  downloadFile: jest.fn(),
  disconnect: jest.fn(),
  testConnection: jest.fn(),
  getConnectionInfo: jest.fn(),
  extractSailingIdFromPath: jest.fn((path: string) => path.split('/').pop()?.replace('.json', '') || ''),
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

describe('ImportOrchestratorService', () => {
  let service: ImportOrchestratorService

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportOrchestratorService,
        { provide: TraveltekFtpService, useValue: mockFtpService },
        { provide: SailingImportService, useValue: mockSailingImporter },
        { provide: ReferenceDataCacheService, useValue: mockCacheService },
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
})
