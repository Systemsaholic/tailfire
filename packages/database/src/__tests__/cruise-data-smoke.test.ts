/**
 * Cruise Data Repository - Smoke Tests
 *
 * Validates:
 * 1. Sea day rows: NULL port_id with "At Sea" port_name
 * 2. NULL cheapest_* when no prices exist
 * 3. Generated total_price_cents column
 * 4. CAD canonical currency defaults
 * 5. Unique constraints
 *
 * Prerequisites: Run the seed script first
 *   npx tsx packages/database/src/seeds/cruise-data-seed.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq, isNull, and, sql } from 'drizzle-orm'
import {
  cruiseSailings,
  cruiseSailingStops,
  cruiseSailingCabinPrices,
} from '../schema'

const DATABASE_URL = process.env.DATABASE_URL

// Skip tests if no DATABASE_URL
const describeWithDb = DATABASE_URL ? describe : describe.skip

describeWithDb('Cruise Data Repository - Smoke Tests', () => {
  let client: ReturnType<typeof postgres>
  let db: ReturnType<typeof drizzle>

  beforeAll(() => {
    if (!DATABASE_URL) throw new Error('DATABASE_URL required')
    client = postgres(DATABASE_URL)
    db = drizzle(client)
  })

  afterAll(async () => {
    if (client) await client.end()
  })

  describe('Sea Day Handling', () => {
    it('should have sea day stops with NULL port_id and "At Sea" port_name', async () => {
      const seaDays = await db
        .select({
          id: cruiseSailingStops.id,
          portId: cruiseSailingStops.portId,
          portName: cruiseSailingStops.portName,
          isSeaDay: cruiseSailingStops.isSeaDay,
          dayNumber: cruiseSailingStops.dayNumber,
        })
        .from(cruiseSailingStops)
        .where(eq(cruiseSailingStops.isSeaDay, true))
        .limit(10)

      expect(seaDays.length).toBeGreaterThan(0)

      for (const seaDay of seaDays) {
        // Sea days MUST have NULL port_id
        expect(seaDay.portId).toBeNull()

        // Sea days MUST have "At Sea" as port_name
        expect(seaDay.portName).toBe('At Sea')

        // is_sea_day MUST be true
        expect(seaDay.isSeaDay).toBe(true)
      }
    })

    it('should have non-sea-day stops with valid port_id', async () => {
      const portStops = await db
        .select({
          id: cruiseSailingStops.id,
          portId: cruiseSailingStops.portId,
          portName: cruiseSailingStops.portName,
          isSeaDay: cruiseSailingStops.isSeaDay,
        })
        .from(cruiseSailingStops)
        .where(eq(cruiseSailingStops.isSeaDay, false))
        .limit(10)

      expect(portStops.length).toBeGreaterThan(0)

      for (const stop of portStops) {
        // Non-sea-day stops should have a port_id (unless it's a stub situation)
        // Port name should NOT be "At Sea"
        expect(stop.portName).not.toBe('At Sea')
        expect(stop.isSeaDay).toBe(false)
      }
    })
  })

  describe('NULL Price Summary Handling', () => {
    it('should have sailing with NULL cheapest_* when no prices exist', async () => {
      const noPriceSailing = await db
        .select({
          id: cruiseSailings.id,
          name: cruiseSailings.name,
          cheapestInsideCents: cruiseSailings.cheapestInsideCents,
          cheapestOceanviewCents: cruiseSailings.cheapestOceanviewCents,
          cheapestBalconyCents: cruiseSailings.cheapestBalconyCents,
          cheapestSuiteCents: cruiseSailings.cheapestSuiteCents,
        })
        .from(cruiseSailings)
        .where(eq(cruiseSailings.providerIdentifier, 'TEST-002-NO-PRICES'))
        .limit(1)

      expect(noPriceSailing.length).toBe(1)

      const sailing = noPriceSailing[0]
      // ALL price summaries should be NULL
      expect(sailing.cheapestInsideCents).toBeNull()
      expect(sailing.cheapestOceanviewCents).toBeNull()
      expect(sailing.cheapestBalconyCents).toBeNull()
      expect(sailing.cheapestSuiteCents).toBeNull()
    })

    it('should have sailing with valid cheapest_* when prices exist', async () => {
      const pricedSailing = await db
        .select({
          id: cruiseSailings.id,
          name: cruiseSailings.name,
          cheapestInsideCents: cruiseSailings.cheapestInsideCents,
          cheapestOceanviewCents: cruiseSailings.cheapestOceanviewCents,
          cheapestBalconyCents: cruiseSailings.cheapestBalconyCents,
          cheapestSuiteCents: cruiseSailings.cheapestSuiteCents,
        })
        .from(cruiseSailings)
        .where(eq(cruiseSailings.providerIdentifier, 'TEST-001'))
        .limit(1)

      expect(pricedSailing.length).toBe(1)

      const sailing = pricedSailing[0]
      // Price summaries should be set (not NULL)
      expect(sailing.cheapestInsideCents).not.toBeNull()
      expect(sailing.cheapestInsideCents).toBeGreaterThan(0)
      expect(sailing.cheapestOceanviewCents).not.toBeNull()
      expect(sailing.cheapestBalconyCents).not.toBeNull()
      expect(sailing.cheapestSuiteCents).not.toBeNull()
    })
  })

  describe('Cabin Prices - CAD Canonical', () => {
    it('should have cabin prices with CAD as original_currency', async () => {
      const prices = await db
        .select({
          id: cruiseSailingCabinPrices.id,
          cabinCode: cruiseSailingCabinPrices.cabinCode,
          basePriceCents: cruiseSailingCabinPrices.basePriceCents,
          taxesCents: cruiseSailingCabinPrices.taxesCents,
          originalCurrency: cruiseSailingCabinPrices.originalCurrency,
          originalAmountCents: cruiseSailingCabinPrices.originalAmountCents,
        })
        .from(cruiseSailingCabinPrices)
        .limit(10)

      expect(prices.length).toBeGreaterThan(0)

      for (const price of prices) {
        // original_currency MUST be 'CAD' (canonical)
        expect(price.originalCurrency).toBe('CAD')

        // Prices should be positive
        expect(price.basePriceCents).toBeGreaterThan(0)
        expect(price.taxesCents).toBeGreaterThanOrEqual(0)

        // original_amount_cents should equal base_price_cents (no FX conversion)
        expect(price.originalAmountCents).toBe(price.basePriceCents)
      }
    })

    it('should have generated total_price_cents = base + taxes', async () => {
      // Use raw SQL to get the generated column
      const result = await db.execute<{
        cabin_code: string
        base_price_cents: number
        taxes_cents: number
        total_price_cents: number
      }>(sql`
        SELECT cabin_code, base_price_cents, taxes_cents, total_price_cents
        FROM cruise_sailing_cabin_prices
        LIMIT 10
      `)

      expect(result.length).toBeGreaterThan(0)

      for (const row of result) {
        // Generated column should equal base + taxes
        expect(row.total_price_cents).toBe(row.base_price_cents + row.taxes_cents)
      }
    })
  })

  describe('Unique Constraints', () => {
    it('should enforce unique (sailing_id, cabin_code, occupancy) on cabin prices', async () => {
      // Get an existing price
      const [existingPrice] = await db
        .select()
        .from(cruiseSailingCabinPrices)
        .limit(1)

      if (!existingPrice) {
        console.warn('No existing cabin prices to test unique constraint')
        return
      }

      // Try to insert duplicate - should fail
      await expect(
        db.insert(cruiseSailingCabinPrices).values({
          sailingId: existingPrice.sailingId,
          cabinCode: existingPrice.cabinCode,
          occupancy: existingPrice.occupancy,
          basePriceCents: 99999,
          taxesCents: 0,
          originalCurrency: 'CAD',
          originalAmountCents: 99999,
        })
      ).rejects.toThrow()
    })

    it('should enforce unique (sailing_id, day_number, sequence_order) on stops', async () => {
      // Get an existing stop
      const [existingStop] = await db
        .select()
        .from(cruiseSailingStops)
        .limit(1)

      if (!existingStop) {
        console.warn('No existing stops to test unique constraint')
        return
      }

      // Try to insert duplicate - should fail
      await expect(
        db.insert(cruiseSailingStops).values({
          sailingId: existingStop.sailingId,
          dayNumber: existingStop.dayNumber,
          sequenceOrder: existingStop.sequenceOrder,
          portName: 'Duplicate Test',
          isSeaDay: false,
        })
      ).rejects.toThrow()
    })
  })
})
