/**
 * Traveltek FTP Service
 *
 * Handles FTP connection and file streaming from Traveltek cruise data feed.
 * Implements:
 * - Connection pooling with automatic reconnect (multiple parallel connections)
 * - Per-file timeout with backoff
 * - Directory traversal (year/month/lineid/shipid/*.json)
 * - Oversized file detection and skip
 */

import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as ftp from 'basic-ftp'
import { Writable } from 'stream'
import { FtpFileInfo, FtpSyncOptions } from '../cruise-import.types'

// ============================================================================
// FTP CONNECTION POOL
// ============================================================================

interface PooledConnection {
  client: ftp.Client
  inUse: boolean
  lastUsed: number
}

class FtpConnectionPool {
  private readonly logger = new Logger('FtpConnectionPool')
  private connections: PooledConnection[] = []
  private maxSize: number
  private host: string
  private user: string
  private password: string
  private secure: boolean

  constructor(
    config: { host: string; user: string; password: string; secure: boolean },
    maxSize: number = 4
  ) {
    this.host = config.host
    this.user = config.user
    this.password = config.password
    this.secure = config.secure
    this.maxSize = maxSize
  }

  /**
   * Acquire an FTP connection from the pool.
   * Creates a new connection if pool isn't full, otherwise waits for one.
   */
  async acquire(): Promise<ftp.Client> {
    // First, try to find an available connection
    const available = this.connections.find((c) => !c.inUse && !c.client.closed)
    if (available) {
      available.inUse = true
      available.lastUsed = Date.now()
      this.logger.debug(`Reusing existing connection (pool size: ${this.connections.length})`)
      return available.client
    }

    // Create new connection if pool isn't full
    if (this.connections.length < this.maxSize) {
      const client = await this.createConnection()
      const pooled: PooledConnection = {
        client,
        inUse: true,
        lastUsed: Date.now(),
      }
      this.connections.push(pooled)
      this.logger.debug(`Created new connection (pool size: ${this.connections.length}/${this.maxSize})`)
      return client
    }

    // Pool is full - wait for a connection to become available
    this.logger.debug('Pool full, waiting for available connection...')
    return this.waitForConnection()
  }

  /**
   * Release a connection back to the pool.
   */
  release(client: ftp.Client): void {
    const pooled = this.connections.find((c) => c.client === client)
    if (pooled) {
      pooled.inUse = false
      pooled.lastUsed = Date.now()
      this.logger.debug('Connection released back to pool')
    }
  }

  /**
   * Close all connections and drain the pool.
   */
  async drain(): Promise<void> {
    this.logger.log(`Draining connection pool (${this.connections.length} connections)`)
    for (const pooled of this.connections) {
      try {
        pooled.client.close()
      } catch {
        // Ignore close errors
      }
    }
    this.connections = []
  }

  /**
   * Get pool statistics.
   */
  getStats(): { total: number; inUse: number; available: number } {
    const inUse = this.connections.filter((c) => c.inUse).length
    return {
      total: this.connections.length,
      inUse,
      available: this.connections.length - inUse,
    }
  }

  private async createConnection(): Promise<ftp.Client> {
    const client = new ftp.Client()
    client.ftp.verbose = false

    await client.access({
      host: this.host,
      user: this.user,
      password: this.password,
      secure: this.secure,
      secureOptions: { rejectUnauthorized: false },
    })

    this.logger.log(`New FTP connection established to ${this.host}`)
    return client
  }

  private async waitForConnection(): Promise<ftp.Client> {
    // Poll every 100ms for an available connection
    const maxWait = 30000 // 30 second timeout
    const startTime = Date.now()

    while (Date.now() - startTime < maxWait) {
      // Check for available or closed connections we can replace
      const available = this.connections.find((c) => !c.inUse && !c.client.closed)
      if (available) {
        available.inUse = true
        available.lastUsed = Date.now()
        return available.client
      }

      // Replace closed connections
      const closedIndex = this.connections.findIndex((c) => c.client.closed)
      if (closedIndex >= 0) {
        const client = await this.createConnection()
        this.connections[closedIndex] = {
          client,
          inUse: true,
          lastUsed: Date.now(),
        }
        return client
      }

      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    throw new Error('Timeout waiting for FTP connection from pool')
  }
}

// ============================================================================
// TRAVELTEK FTP SERVICE
// ============================================================================

@Injectable()
export class TraveltekFtpService implements OnModuleDestroy {
  private readonly logger = new Logger(TraveltekFtpService.name)

  // Single connection for directory listing (sequential operation)
  private client: ftp.Client | null = null

  // Connection pool for parallel file downloads
  private connectionPool: FtpConnectionPool | null = null
  private readonly DEFAULT_POOL_SIZE = 4

  // FTP Configuration - read from ConfigService (loaded after .env parsing)
  private readonly ftpHost: string
  private readonly ftpUser: string
  private readonly ftpPassword: string
  private readonly ftpSecure: boolean

  constructor(private readonly configService: ConfigService) {
    this.ftpHost = this.configService.get<string>('TRAVELTEK_FTP_HOST', 'ftpeu1prod.traveltek.net')
    this.ftpUser = this.configService.get<string>('TRAVELTEK_FTP_USER', '')
    this.ftpPassword = this.configService.get<string>('TRAVELTEK_FTP_PASSWORD', '')
    this.ftpSecure = this.configService.get<string>('TRAVELTEK_FTP_SECURE', 'true') !== 'false'
  }

  // Defaults
  private readonly DEFAULT_FILE_TIMEOUT_MS = 30000
  private readonly DEFAULT_RETRY_ATTEMPTS = 3
  private readonly DEFAULT_RETRY_DELAY_MS = 1000
  private readonly DEFAULT_MAX_FILE_SIZE_BYTES = 500000 // 500KB

  async onModuleDestroy() {
    await this.disconnect()
  }

  // ============================================================================
  // CONNECTION MANAGEMENT
  // ============================================================================

  async connect(): Promise<void> {
    if (this.client && !this.client.closed) {
      return // Already connected
    }

    this.client = new ftp.Client()
    this.client.ftp.verbose = this.configService.get<string>('FTP_VERBOSE', 'false') === 'true'

    try {
      await this.client.access({
        host: this.ftpHost,
        user: this.ftpUser,
        password: this.ftpPassword,
        secure: this.ftpSecure,
        secureOptions: { rejectUnauthorized: false },
      })
      this.logger.log(`Connected to FTP: ${this.ftpHost}`)
    } catch (error) {
      this.logger.error(`FTP connection failed: ${error}`)
      this.client = null
      throw error
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      this.client.close()
      this.client = null
      this.logger.log('FTP connection closed')
    }

    // Also drain the connection pool
    if (this.connectionPool) {
      await this.connectionPool.drain()
      this.connectionPool = null
    }
  }

  private async ensureConnected(): Promise<ftp.Client> {
    if (!this.client || this.client.closed) {
      await this.connect()
    }
    return this.client!
  }

  /**
   * Force a fresh FTP connection by closing any existing connection first.
   * Use this at the start of sync operations to avoid stale connections.
   */
  async forceReconnect(): Promise<void> {
    this.logger.log('Forcing fresh FTP connection...')
    if (this.client) {
      try {
        this.client.close()
      } catch {
        // Ignore close errors on stale client
      }
      this.client = null
    }
    await this.connect()
  }

  /**
   * Initialize the connection pool for parallel downloads.
   * Call this before running concurrent file downloads.
   */
  initializePool(poolSize?: number): void {
    if (this.connectionPool) {
      return // Pool already exists
    }

    const size = poolSize ?? this.DEFAULT_POOL_SIZE
    this.connectionPool = new FtpConnectionPool(
      {
        host: this.ftpHost,
        user: this.ftpUser,
        password: this.ftpPassword,
        secure: this.ftpSecure,
      },
      size
    )
    this.logger.log(`FTP connection pool initialized (max size: ${size})`)
  }

  /**
   * Get pool statistics for monitoring.
   */
  getPoolStats(): { total: number; inUse: number; available: number } | null {
    return this.connectionPool?.getStats() ?? null
  }

  /**
   * Check if the connection pool has been initialized.
   */
  isPoolInitialized(): boolean {
    return this.connectionPool !== null
  }

  // ============================================================================
  // DIRECTORY TRAVERSAL
  // ============================================================================

  /**
   * List all JSON files matching the filter criteria.
   * FTP structure: /year/month/lineid/shipid/codetocruiseid.json
   *
   * By default, only returns current month + future sailings.
   * Set includeHistorical=true to include past months.
   *
   * Year handling:
   * - If options.year is specified, only that year is scanned
   * - Otherwise, dynamically discovers all year folders from FTP root
   *   and scans current year + all future years
   */
  async listSailingFiles(options: FtpSyncOptions = {}): Promise<FtpFileInfo[]> {
    const client = await this.ensureConnected()
    const files: FtpFileInfo[] = []

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // 1-indexed

    // Determine years to scan
    let years: number[]
    if (options.year) {
      years = [options.year]
    } else {
      // Dynamically discover available year folders from FTP root
      years = await this.discoverAvailableYears(client, currentYear)
      this.logger.log(`Discovered ${years.length} year folders: ${years.join(', ')}`)
    }

    for (const year of years) {
      // Check for cancellation at year level
      if (options.shouldCancel?.()) {
        this.logger.log('File listing cancelled by user')
        return files
      }

      const yearPath = `/${year}`

      try {
        const months = await client.list(yearPath)

        for (const monthDir of months) {
          // Check for cancellation at month level
          if (options.shouldCancel?.()) {
            this.logger.log('File listing cancelled by user')
            return files
          }

          if (!monthDir.isDirectory) continue

          const monthNum = parseInt(monthDir.name, 10)
          if (isNaN(monthNum)) continue

          // Filter by specific month if provided
          if (options.month && monthNum !== options.month) continue

          // Skip historical months unless explicitly requested
          if (!options.includeHistorical) {
            const isHistorical =
              year < currentYear || (year === currentYear && monthNum < currentMonth)
            if (isHistorical) continue
          }

          const monthPath = `${yearPath}/${monthDir.name}`

          try {
            const lines = await client.list(monthPath)

            for (const lineDir of lines) {
              // Check for cancellation at line level
              if (options.shouldCancel?.()) {
                this.logger.log('File listing cancelled by user')
                return files
              }

              if (!lineDir.isDirectory) continue
              if (options.lineId && lineDir.name !== options.lineId) continue

              const linePath = `${monthPath}/${lineDir.name}`

              try {
                // Re-check connection before each line directory
                if (this.client?.closed) {
                  this.logger.debug('FTP connection closed, reconnecting...')
                  await this.connect()
                }

                const ships = await client.list(linePath)

                for (const shipDir of ships) {
                  if (!shipDir.isDirectory) continue
                  if (options.shipId && shipDir.name !== options.shipId) continue

                  const shipPath = `${linePath}/${shipDir.name}`

                  try {
                    const sailingFiles = await client.list(shipPath)

                    for (const file of sailingFiles) {
                      if (!file.name.endsWith('.json')) continue

                      files.push({
                        path: `${shipPath}/${file.name}`,
                        name: file.name,
                        size: file.size,
                        modifiedAt: file.modifiedAt,
                      })

                      // Check max files limit
                      if (options.maxFiles && files.length >= options.maxFiles) {
                        this.logger.log(`Reached maxFiles limit: ${options.maxFiles}`)
                        return files
                      }
                    }
                  } catch (err) {
                    this.logger.debug(`Failed to list ship dir ${shipPath}: ${err}`)
                  }
                }
              } catch (err) {
                this.logger.debug(`Failed to list line dir ${linePath}: ${err}`)
              }
            }
          } catch (err) {
            this.logger.warn(`Failed to list month dir ${monthPath}: ${err}`)
          }
        }
      } catch (err) {
        this.logger.warn(`Failed to list year dir ${yearPath}: ${err}`)
      }
    }

    this.logger.log(`Found ${files.length} sailing files`)
    return files
  }

  // ============================================================================
  // FILE DOWNLOAD
  // ============================================================================

  /**
   * Download a file with timeout and retry logic.
   * Returns null if file is oversized or download fails after retries.
   */
  async downloadFile(
    filePath: string,
    options: FtpSyncOptions = {}
  ): Promise<{ content: string; size: number } | null> {
    const maxSize = options.maxFileSizeBytes ?? this.DEFAULT_MAX_FILE_SIZE_BYTES
    const timeout = options.fileTimeoutMs ?? this.DEFAULT_FILE_TIMEOUT_MS
    const retryAttempts = options.retryAttempts ?? this.DEFAULT_RETRY_ATTEMPTS
    const retryDelay = options.retryDelayMs ?? this.DEFAULT_RETRY_DELAY_MS

    // Check file size first
    const client = await this.ensureConnected()

    try {
      const size = await client.size(filePath)
      if (size > maxSize) {
        this.logger.warn(`File oversized (${size} > ${maxSize}): ${filePath}`)
        return null
      }
    } catch {
      // Size check failed, try to download anyway
    }

    // Download with retry
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        const content = await this.downloadWithTimeout(filePath, timeout)
        return { content, size: content.length }
      } catch (error) {
        this.logger.warn(
          `Download attempt ${attempt}/${retryAttempts} failed for ${filePath}: ${error}`
        )

        if (attempt < retryAttempts) {
          // Exponential backoff
          const delay = retryDelay * Math.pow(2, attempt - 1)
          await this.sleep(delay)

          // Reconnect on failure
          await this.disconnect()
          await this.connect()
        }
      }
    }

    this.logger.error(`All download attempts failed for ${filePath}`)
    return null
  }

  private async downloadWithTimeout(filePath: string, timeoutMs: number): Promise<string> {
    const client = await this.ensureConnected()

    return new Promise<string>((resolve, reject) => {
      const chunks: Buffer[] = []
      let timedOut = false

      const timer = setTimeout(() => {
        timedOut = true
        reject(new Error(`Download timeout after ${timeoutMs}ms`))
      }, timeoutMs)

      const writable = new Writable({
        write(chunk: Buffer, _encoding: string, callback: () => void) {
          if (!timedOut) {
            chunks.push(chunk)
          }
          callback()
        },
      })

      client
        .downloadTo(writable, filePath)
        .then(() => {
          clearTimeout(timer)
          if (!timedOut) {
            const content = Buffer.concat(chunks).toString('utf8')
            resolve(content)
          }
        })
        .catch((err) => {
          clearTimeout(timer)
          if (!timedOut) {
            reject(err)
          }
        })
    })
  }

  // ============================================================================
  // POOLED FILE DOWNLOAD (for concurrent downloads)
  // ============================================================================

  /**
   * Download a file using the connection pool.
   * This method is safe for concurrent use - each call gets its own connection.
   */
  async downloadFilePooled(
    filePath: string,
    options: FtpSyncOptions = {}
  ): Promise<{ content: string; size: number } | null> {
    if (!this.connectionPool) {
      // Fallback to single connection if pool not initialized
      return this.downloadFile(filePath, options)
    }

    const maxSize = options.maxFileSizeBytes ?? this.DEFAULT_MAX_FILE_SIZE_BYTES
    const timeout = options.fileTimeoutMs ?? this.DEFAULT_FILE_TIMEOUT_MS
    const retryAttempts = options.retryAttempts ?? this.DEFAULT_RETRY_ATTEMPTS
    const retryDelay = options.retryDelayMs ?? this.DEFAULT_RETRY_DELAY_MS

    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      let client: ftp.Client | null = null

      try {
        // Acquire connection from pool
        client = await this.connectionPool.acquire()

        // Check file size (optional - skip if it causes issues)
        try {
          const size = await client.size(filePath)
          if (size > maxSize) {
            this.logger.warn(`File oversized (${size} > ${maxSize}): ${filePath}`)
            return null
          }
        } catch {
          // Size check failed, try to download anyway
        }

        // Download with timeout
        const content = await this.downloadWithTimeoutPooled(client, filePath, timeout)
        return { content, size: content.length }
      } catch (error) {
        this.logger.warn(
          `Pooled download attempt ${attempt}/${retryAttempts} failed for ${filePath}: ${error}`
        )

        if (attempt < retryAttempts) {
          const delay = retryDelay * Math.pow(2, attempt - 1)
          await this.sleep(delay)
        }
      } finally {
        // Always release the connection back to the pool
        if (client && this.connectionPool) {
          this.connectionPool.release(client)
        }
      }
    }

    this.logger.error(`All pooled download attempts failed for ${filePath}`)
    return null
  }

  private async downloadWithTimeoutPooled(
    client: ftp.Client,
    filePath: string,
    timeoutMs: number
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const chunks: Buffer[] = []
      let timedOut = false

      const timer = setTimeout(() => {
        timedOut = true
        reject(new Error(`Download timeout after ${timeoutMs}ms`))
      }, timeoutMs)

      const writable = new Writable({
        write(chunk: Buffer, _encoding: string, callback: () => void) {
          if (!timedOut) {
            chunks.push(chunk)
          }
          callback()
        },
      })

      client
        .downloadTo(writable, filePath)
        .then(() => {
          clearTimeout(timer)
          if (!timedOut) {
            const content = Buffer.concat(chunks).toString('utf8')
            resolve(content)
          }
        })
        .catch((err) => {
          clearTimeout(timer)
          if (!timedOut) {
            reject(err)
          }
        })
    })
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Discover all available year folders from FTP root.
   * Returns current year + all future years found, sorted ascending.
   * This enables automatic discovery of new years (e.g., 2029) when Traveltek adds them.
   */
  private async discoverAvailableYears(client: ftp.Client, currentYear: number): Promise<number[]> {
    try {
      const rootContents = await client.list('/')
      const years: number[] = []

      for (const entry of rootContents) {
        if (!entry.isDirectory) continue

        const yearNum = parseInt(entry.name, 10)
        // Valid year: 4 digits, and is current year or future
        if (!isNaN(yearNum) && yearNum >= currentYear && yearNum >= 2000 && yearNum <= 2100) {
          years.push(yearNum)
        }
      }

      // Sort ascending so we process years in order
      years.sort((a, b) => a - b)

      if (years.length === 0) {
        // Fallback to current year if no years found
        this.logger.warn('No year folders found on FTP, falling back to current year')
        return [currentYear]
      }

      return years
    } catch (error) {
      this.logger.error(`Failed to discover year folders: ${error}`)
      // Fallback to current year + next year if discovery fails
      return [currentYear, currentYear + 1]
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Extract sailing ID from file path.
   * Path format: /year/month/lineid/shipid/codetocruiseid.json
   */
  extractSailingIdFromPath(filePath: string): string {
    const filename = filePath.split('/').pop() || ''
    return filename.replace('.json', '')
  }

  /**
   * Extract all identifiers from file path.
   * Path format: /year/month/lineid/shipid/codetocruiseid.json
   * Returns: { cruiselineid, shipid, codetocruiseid }
   */
  extractIdsFromPath(filePath: string): {
    cruiselineid: string
    shipid: string
    codetocruiseid: string
  } {
    // Path: /2025/12/1/180/2089722.json
    // Segments: ['', '2025', '12', '1', '180', '2089722.json']
    const segments = filePath.split('/')
    const filename = segments.pop() || ''
    const shipid = segments.pop() || ''
    const cruiselineid = segments.pop() || ''
    const codetocruiseid = filename.replace('.json', '')

    return { cruiselineid, shipid, codetocruiseid }
  }

  /**
   * Test FTP connection using a separate isolated client.
   * This won't interfere with any ongoing sync operations.
   */
  async testConnection(): Promise<boolean> {
    // Use a separate client to avoid interrupting any ongoing operations
    const testClient = new ftp.Client()
    testClient.ftp.verbose = false

    try {
      await testClient.access({
        host: this.ftpHost,
        user: this.ftpUser,
        password: this.ftpPassword,
        secure: this.ftpSecure,
        secureOptions: { rejectUnauthorized: false },
      })
      await testClient.list('/')
      this.logger.log('FTP connection test successful')
      return true
    } catch (error) {
      this.logger.error(`FTP connection test failed: ${error}`)
      return false
    } finally {
      testClient.close()
    }
  }

  /**
   * Get FTP server info for debugging.
   */
  getConnectionInfo(): { host: string; user: string; connected: boolean } {
    return {
      host: this.ftpHost,
      user: this.ftpUser,
      connected: !!this.client && !this.client.closed,
    }
  }

  /**
   * Get all available year folders from the FTP server.
   * Returns all years found (past, current, and future).
   * Uses a separate connection to avoid interfering with sync operations.
   */
  async getAvailableYears(): Promise<number[]> {
    const testClient = new ftp.Client()
    testClient.ftp.verbose = false

    try {
      await testClient.access({
        host: this.ftpHost,
        user: this.ftpUser,
        password: this.ftpPassword,
        secure: this.ftpSecure,
        secureOptions: { rejectUnauthorized: false },
      })

      const rootContents = await testClient.list('/')
      const years: number[] = []

      for (const entry of rootContents) {
        if (!entry.isDirectory) continue

        const yearNum = parseInt(entry.name, 10)
        // Valid year: 4 digits between 2000 and 2100
        if (!isNaN(yearNum) && yearNum >= 2000 && yearNum <= 2100) {
          years.push(yearNum)
        }
      }

      // Sort ascending
      years.sort((a, b) => a - b)

      this.logger.log(`Discovered ${years.length} year folders: ${years.join(', ')}`)
      return years
    } catch (error) {
      this.logger.error(`Failed to get available years: ${error}`)
      throw error
    } finally {
      testClient.close()
    }
  }
}
