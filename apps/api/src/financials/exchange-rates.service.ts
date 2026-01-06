/**
 * Exchange Rates Service
 *
 * Handles currency exchange rate operations:
 * - Fetches rates from ExchangeRate-API (free tier)
 * - Caches rates in database for offline/performance
 * - Provides currency conversion utilities
 * - Supports rate date lookups for historical conversions
 */

import { Injectable, Logger, BadRequestException, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Cron, CronExpression } from '@nestjs/schedule'
import { eq, and, desc, sql } from 'drizzle-orm'
import { DatabaseService } from '../db/database.service'
import type {
  CurrencyExchangeRateResponseDto,
  ConvertCurrencyDto,
  ConvertCurrencyResponseDto,
} from '@tailfire/shared-types'

// Common currencies for travel agencies
const SUPPORTED_CURRENCIES = [
  'CAD', 'USD', 'EUR', 'GBP', 'AUD', 'NZD', 'MXN', 'JPY',
  'CHF', 'SGD', 'HKD', 'CNY', 'THB', 'INR', 'ZAR', 'BRL',
]

// ExchangeRate-API response types
interface ExchangeRateApiResponse {
  result: 'success' | 'error'
  base_code: string
  time_last_update_utc: string
  conversion_rates: Record<string, number>
  error?: string
}

@Injectable()
export class ExchangeRatesService {
  private readonly logger = new Logger(ExchangeRatesService.name)
  private readonly apiKey: string | undefined
  private readonly baseUrl = 'https://v6.exchangerate-api.com/v6'

  constructor(
    private readonly db: DatabaseService,
    private readonly configService: ConfigService
  ) {
    this.apiKey = this.configService.get<string>('EXCHANGE_RATE_API_KEY')
    if (!this.apiKey) {
      this.logger.warn('EXCHANGE_RATE_API_KEY not configured - using fallback rates')
    }
  }

  /**
   * Get exchange rate between two currencies
   * Uses cached rate from database, or fetches fresh rate if not available
   */
  async getExchangeRate(
    fromCurrency: string,
    toCurrency: string,
    date?: string
  ): Promise<CurrencyExchangeRateResponseDto> {
    const normalizedFrom = fromCurrency.toUpperCase()
    const normalizedTo = toCurrency.toUpperCase()
    const rateDate = date || this.getTodayDate()

    // Same currency - return 1:1 rate
    if (normalizedFrom === normalizedTo) {
      return {
        id: 'same-currency',
        fromCurrency: normalizedFrom,
        toCurrency: normalizedTo,
        rate: '1.00000000',
        rateDate,
        source: 'identity',
        createdAt: new Date().toISOString(),
      }
    }

    // Try to get cached rate from database
    const cachedRate = await this.getCachedRate(normalizedFrom, normalizedTo, rateDate)
    if (cachedRate) {
      return cachedRate
    }

    // Fetch fresh rate from API
    const rate = await this.fetchAndCacheRate(normalizedFrom, normalizedTo, rateDate)
    return rate
  }

  /**
   * Convert an amount between currencies
   */
  async convertCurrency(dto: ConvertCurrencyDto): Promise<ConvertCurrencyResponseDto> {
    const { amountCents, fromCurrency, toCurrency, date } = dto

    if (amountCents < 0) {
      throw new BadRequestException('Amount must be non-negative')
    }

    const rateInfo = await this.getExchangeRate(fromCurrency, toCurrency, date)
    const rate = parseFloat(rateInfo.rate)
    const convertedAmountCents = Math.round(amountCents * rate)

    return {
      originalAmountCents: amountCents,
      originalCurrency: fromCurrency.toUpperCase(),
      convertedAmountCents,
      convertedCurrency: toCurrency.toUpperCase(),
      rate: rateInfo.rate,
      rateDate: rateInfo.rateDate,
    }
  }

  /**
   * Get all supported currencies
   */
  getSupportedCurrencies(): string[] {
    return [...SUPPORTED_CURRENCIES]
  }

  /**
   * Get latest rates for all supported currencies from a base currency
   */
  async getLatestRates(baseCurrency: string): Promise<CurrencyExchangeRateResponseDto[]> {
    const normalizedBase = baseCurrency.toUpperCase()
    const today = this.getTodayDate()

    const rates: CurrencyExchangeRateResponseDto[] = []

    for (const currency of SUPPORTED_CURRENCIES) {
      if (currency !== normalizedBase) {
        try {
          const rate = await this.getExchangeRate(normalizedBase, currency, today)
          rates.push(rate)
        } catch (error) {
          this.logger.warn(`Failed to get rate for ${normalizedBase}/${currency}: ${error}`)
        }
      }
    }

    return rates
  }

  /**
   * Scheduled job to refresh exchange rates daily
   * Runs at 6 AM UTC to get fresh rates for the day
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async refreshDailyRates(): Promise<void> {
    this.logger.log('Starting daily exchange rate refresh...')

    const baseCurrencies = ['CAD', 'USD', 'EUR', 'GBP']

    for (const base of baseCurrencies) {
      try {
        await this.fetchAllRatesFromApi(base)
        this.logger.log(`Refreshed rates for ${base}`)
      } catch (error) {
        this.logger.error(`Failed to refresh rates for ${base}: ${error}`)
      }
    }

    this.logger.log('Daily exchange rate refresh complete')
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Get cached rate from database
   * Note: rateDate in database is stored as string (YYYY-MM-DD)
   */
  private async getCachedRate(
    fromCurrency: string,
    toCurrency: string,
    rateDate: string
  ): Promise<CurrencyExchangeRateResponseDto | null> {
    const [cached] = await this.db.client
      .select()
      .from(this.db.schema.currencyExchangeRates)
      .where(
        and(
          eq(this.db.schema.currencyExchangeRates.fromCurrency, fromCurrency),
          eq(this.db.schema.currencyExchangeRates.toCurrency, toCurrency),
          eq(this.db.schema.currencyExchangeRates.rateDate, rateDate)
        )
      )
      .limit(1)

    if (cached) {
      return {
        id: cached.id,
        fromCurrency: cached.fromCurrency,
        toCurrency: cached.toCurrency,
        rate: cached.rate,
        rateDate: cached.rateDate,
        source: cached.source,
        createdAt: cached.createdAt.toISOString(),
      }
    }

    // If no rate for exact date, try to get most recent rate
    const [mostRecent] = await this.db.client
      .select()
      .from(this.db.schema.currencyExchangeRates)
      .where(
        and(
          eq(this.db.schema.currencyExchangeRates.fromCurrency, fromCurrency),
          eq(this.db.schema.currencyExchangeRates.toCurrency, toCurrency),
          sql`${this.db.schema.currencyExchangeRates.rateDate} <= ${rateDate}`
        )
      )
      .orderBy(desc(this.db.schema.currencyExchangeRates.rateDate))
      .limit(1)

    if (mostRecent) {
      return {
        id: mostRecent.id,
        fromCurrency: mostRecent.fromCurrency,
        toCurrency: mostRecent.toCurrency,
        rate: mostRecent.rate,
        rateDate: mostRecent.rateDate,
        source: mostRecent.source,
        createdAt: mostRecent.createdAt.toISOString(),
      }
    }

    return null
  }

  /**
   * Fetch rate from API and cache in database
   */
  private async fetchAndCacheRate(
    fromCurrency: string,
    toCurrency: string,
    rateDate: string
  ): Promise<CurrencyExchangeRateResponseDto> {
    // If no API key, use fallback rates
    if (!this.apiKey) {
      return this.getFallbackRate(fromCurrency, toCurrency, rateDate)
    }

    try {
      const response = await fetch(`${this.baseUrl}/${this.apiKey}/latest/${fromCurrency}`)

      if (!response.ok) {
        throw new ServiceUnavailableException(`Exchange rate API returned ${response.status}`)
      }

      const data = (await response.json()) as ExchangeRateApiResponse

      if (data.result !== 'success') {
        throw new ServiceUnavailableException(`Exchange rate API error: ${data.error}`)
      }

      const rate = data.conversion_rates[toCurrency]
      if (rate === undefined) {
        throw new BadRequestException(`Currency ${toCurrency} not supported`)
      }

      // Cache the rate in database (rateDate is stored as string YYYY-MM-DD)
      const [inserted] = await this.db.client
        .insert(this.db.schema.currencyExchangeRates)
        .values({
          fromCurrency,
          toCurrency,
          rate: rate.toFixed(8),
          rateDate,
          source: 'exchangerate-api',
        })
        .onConflictDoUpdate({
          target: [
            this.db.schema.currencyExchangeRates.fromCurrency,
            this.db.schema.currencyExchangeRates.toCurrency,
            this.db.schema.currencyExchangeRates.rateDate,
          ],
          set: {
            rate: rate.toFixed(8),
            source: 'exchangerate-api',
          },
        })
        .returning()

      return {
        id: inserted!.id,
        fromCurrency: inserted!.fromCurrency,
        toCurrency: inserted!.toCurrency,
        rate: inserted!.rate,
        rateDate: inserted!.rateDate,
        source: inserted!.source,
        createdAt: inserted!.createdAt.toISOString(),
      }
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ServiceUnavailableException) {
        throw error
      }
      this.logger.error(`Failed to fetch exchange rate: ${error}`)
      // Fall back to cached or fallback rates
      return this.getFallbackRate(fromCurrency, toCurrency, rateDate)
    }
  }

  /**
   * Fetch all rates from API for a base currency and cache them
   */
  private async fetchAllRatesFromApi(baseCurrency: string): Promise<void> {
    if (!this.apiKey) {
      this.logger.warn('No API key - skipping rate fetch')
      return
    }

    const response = await fetch(`${this.baseUrl}/${this.apiKey}/latest/${baseCurrency}`)

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }

    const data = (await response.json()) as ExchangeRateApiResponse

    if (data.result !== 'success') {
      throw new Error(`API error: ${data.error}`)
    }

    const today = this.getTodayDate()

    // Insert all rates
    for (const [currency, rate] of Object.entries(data.conversion_rates)) {
      if (SUPPORTED_CURRENCIES.includes(currency) && currency !== baseCurrency) {
        await this.db.client
          .insert(this.db.schema.currencyExchangeRates)
          .values({
            fromCurrency: baseCurrency,
            toCurrency: currency,
            rate: rate.toFixed(8),
            rateDate: today,
            source: 'exchangerate-api',
          })
          .onConflictDoUpdate({
            target: [
              this.db.schema.currencyExchangeRates.fromCurrency,
              this.db.schema.currencyExchangeRates.toCurrency,
              this.db.schema.currencyExchangeRates.rateDate,
            ],
            set: {
              rate: rate.toFixed(8),
              source: 'exchangerate-api',
            },
          })
      }
    }
  }

  /**
   * Get fallback exchange rate when API is unavailable
   * Uses hardcoded approximate rates as last resort
   */
  private getFallbackRate(
    fromCurrency: string,
    toCurrency: string,
    rateDate: string
  ): CurrencyExchangeRateResponseDto {
    // Approximate fallback rates relative to USD (updated Nov 2024)
    const usdRates: Record<string, number> = {
      CAD: 1.38,
      USD: 1.00,
      EUR: 0.92,
      GBP: 0.79,
      AUD: 1.53,
      NZD: 1.67,
      MXN: 17.20,
      JPY: 154.00,
      CHF: 0.88,
      SGD: 1.34,
      HKD: 7.78,
      CNY: 7.24,
      THB: 34.50,
      INR: 84.00,
      ZAR: 17.80,
      BRL: 5.78,
    }

    const fromRate = usdRates[fromCurrency]
    const toRate = usdRates[toCurrency]

    if (!fromRate || !toRate) {
      throw new BadRequestException(`Currency pair ${fromCurrency}/${toCurrency} not supported`)
    }

    // Calculate cross rate
    const rate = toRate / fromRate

    this.logger.warn(`Using fallback rate for ${fromCurrency}/${toCurrency}: ${rate}`)

    return {
      id: 'fallback',
      fromCurrency,
      toCurrency,
      rate: rate.toFixed(8),
      rateDate,
      source: 'fallback',
      createdAt: new Date().toISOString(),
    }
  }

  /**
   * Get today's date in YYYY-MM-DD format
   */
  private getTodayDate(): string {
    const parts = new Date().toISOString().split('T')
    return parts[0] ?? ''
  }
}
