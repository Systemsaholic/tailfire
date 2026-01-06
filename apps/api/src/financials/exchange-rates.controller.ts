/**
 * Exchange Rates Controller
 *
 * REST API endpoints for currency exchange rate operations.
 *
 * Endpoints:
 * - GET /exchange-rates/:from/:to - Get exchange rate between two currencies
 * - POST /exchange-rates/convert - Convert amount between currencies
 * - GET /exchange-rates/currencies - List supported currencies
 * - GET /exchange-rates/:base/all - Get all rates from a base currency
 */

import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { ExchangeRatesService } from './exchange-rates.service'
import type {
  CurrencyExchangeRateResponseDto,
  ConvertCurrencyDto,
  ConvertCurrencyResponseDto,
} from '@tailfire/shared-types'

@ApiTags('Exchange Rates')
@Controller('exchange-rates')
export class ExchangeRatesController {
  constructor(private readonly exchangeRatesService: ExchangeRatesService) {}

  /**
   * Get exchange rate between two currencies
   * GET /exchange-rates/:from/:to?date=YYYY-MM-DD
   */
  @Get(':from/:to')
  async getRate(
    @Param('from') from: string,
    @Param('to') to: string,
    @Query('date') date?: string
  ): Promise<CurrencyExchangeRateResponseDto> {
    return this.exchangeRatesService.getExchangeRate(from, to, date)
  }

  /**
   * Convert an amount between currencies
   * POST /exchange-rates/convert
   */
  @Post('convert')
  async convert(@Body() dto: ConvertCurrencyDto): Promise<ConvertCurrencyResponseDto> {
    return this.exchangeRatesService.convertCurrency(dto)
  }

  /**
   * List all supported currencies
   * GET /exchange-rates/currencies
   */
  @Get('currencies')
  getCurrencies(): { currencies: string[] } {
    return { currencies: this.exchangeRatesService.getSupportedCurrencies() }
  }

  /**
   * Get all exchange rates from a base currency
   * GET /exchange-rates/:base/all
   */
  @Get(':base/all')
  async getAllRates(
    @Param('base') base: string
  ): Promise<{ baseCurrency: string; rates: CurrencyExchangeRateResponseDto[] }> {
    const rates = await this.exchangeRatesService.getLatestRates(base)
    return { baseCurrency: base.toUpperCase(), rates }
  }
}
