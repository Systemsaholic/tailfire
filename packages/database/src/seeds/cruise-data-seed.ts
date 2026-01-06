/**
 * Cruise Data Repository - Synthetic Seed Script
 *
 * Creates minimal test data for smoke testing:
 * - 2 cruise lines
 * - 3 ships (with images, decks, cabin types)
 * - 2 regions
 * - 3 ports
 * - 5 sailings (including one with no prices for NULL cheapest_* test)
 * - Sea day stops (NULL port_id, "At Sea" port_name)
 *
 * Run with: npx tsx packages/database/src/seeds/cruise-data-seed.ts
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq } from 'drizzle-orm'
import {
  cruiseLines,
  cruiseShips,
  cruiseRegions,
  cruisePorts,
  cruiseShipImages,
  cruiseShipDecks,
  cruiseShipCabinTypes,
  cruiseSailings,
  cruiseSailingRegions,
  cruiseSailingStops,
  cruiseSailingCabinPrices,
} from '../schema'

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required')
  process.exit(1)
}

const client = postgres(DATABASE_URL)
const db = drizzle(client)

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function seed() {
  console.log('🚢 Seeding cruise data repository...\n')

  // ============================================================================
  // CRUISE LINES
  // ============================================================================
  console.log('Creating cruise lines...')
  const [royalCaribbean] = await db
    .insert(cruiseLines)
    .values({
      name: 'Royal Caribbean International',
      slug: 'royal-caribbean-international',
      provider: 'traveltek',
      providerIdentifier: 'RCI',
      metadata: { logo_url: 'https://example.com/rci-logo.png' },
    })
    .onConflictDoNothing()
    .returning()

  const [norwegian] = await db
    .insert(cruiseLines)
    .values({
      name: 'Norwegian Cruise Line',
      slug: 'norwegian-cruise-line',
      provider: 'traveltek',
      providerIdentifier: 'NCL',
      metadata: { logo_url: 'https://example.com/ncl-logo.png' },
    })
    .onConflictDoNothing()
    .returning()

  // Fetch existing if conflict
  const rciLine =
    royalCaribbean ||
    (await db.select().from(cruiseLines).where(eq(cruiseLines.slug, 'royal-caribbean-international')))[0]
  const nclLine =
    norwegian ||
    (await db.select().from(cruiseLines).where(eq(cruiseLines.slug, 'norwegian-cruise-line')))[0]

  console.log(`  ✓ Created/found ${rciLine?.name}, ${nclLine?.name}`)

  // ============================================================================
  // REGIONS
  // ============================================================================
  console.log('Creating regions...')
  const [caribbean] = await db
    .insert(cruiseRegions)
    .values({
      name: 'Caribbean',
      slug: 'caribbean',
      provider: 'traveltek',
      providerIdentifier: 'CAR',
    })
    .onConflictDoNothing()
    .returning()

  const [alaska] = await db
    .insert(cruiseRegions)
    .values({
      name: 'Alaska',
      slug: 'alaska',
      provider: 'traveltek',
      providerIdentifier: 'ALA',
    })
    .onConflictDoNothing()
    .returning()

  const caribbeanRegion =
    caribbean || (await db.select().from(cruiseRegions).where(eq(cruiseRegions.slug, 'caribbean')))[0]
  const alaskaRegion =
    alaska || (await db.select().from(cruiseRegions).where(eq(cruiseRegions.slug, 'alaska')))[0]

  console.log(`  ✓ Created/found ${caribbeanRegion?.name}, ${alaskaRegion?.name}`)

  // ============================================================================
  // PORTS
  // ============================================================================
  console.log('Creating ports...')
  const portData = [
    { name: 'Miami, Florida', slug: 'miami-florida', providerIdentifier: 'MIA', latitude: 25.7617, longitude: -80.1918 },
    { name: 'Nassau, Bahamas', slug: 'nassau-bahamas', providerIdentifier: 'NAS', latitude: 25.0443, longitude: -77.3504 },
    { name: 'Seattle, Washington', slug: 'seattle-washington', providerIdentifier: 'SEA', latitude: 47.6062, longitude: -122.3321 },
  ]

  const ports: (typeof cruisePorts.$inferSelect)[] = []
  for (const port of portData) {
    const [inserted] = await db
      .insert(cruisePorts)
      .values({
        name: port.name,
        slug: port.slug,
        provider: 'traveltek',
        providerIdentifier: port.providerIdentifier,
        metadata: { latitude: port.latitude, longitude: port.longitude },
      })
      .onConflictDoNothing()
      .returning()

    const p = inserted || (await db.select().from(cruisePorts).where(eq(cruisePorts.slug, port.slug)))[0]
    if (p) ports.push(p)
  }
  console.log(`  ✓ Created/found ${ports.length} ports`)

  // ============================================================================
  // SHIPS
  // ============================================================================
  console.log('Creating ships...')
  const shipData = [
    { name: 'Symphony of the Seas', lineId: rciLine!.id, providerIdentifier: 'SYM', shipClass: 'Oasis Class' },
    { name: 'Wonder of the Seas', lineId: rciLine!.id, providerIdentifier: 'WON', shipClass: 'Oasis Class' },
    { name: 'Norwegian Encore', lineId: nclLine!.id, providerIdentifier: 'ENC', shipClass: 'Breakaway Plus' },
  ]

  const ships: (typeof cruiseShips.$inferSelect)[] = []
  for (const ship of shipData) {
    const slug = slugify(ship.name)
    const [inserted] = await db
      .insert(cruiseShips)
      .values({
        name: ship.name,
        slug,
        provider: 'traveltek',
        providerIdentifier: ship.providerIdentifier,
        cruiseLineId: ship.lineId,
        shipClass: ship.shipClass,
        metadata: { year_built: 2018, passenger_capacity: 5500 },
      })
      .onConflictDoNothing()
      .returning()

    const s = inserted || (await db.select().from(cruiseShips).where(eq(cruiseShips.slug, slug)))[0]
    if (s) ships.push(s)
  }
  console.log(`  ✓ Created/found ${ships.length} ships`)

  // ============================================================================
  // SHIP IMAGES (for first ship)
  // ============================================================================
  console.log('Creating ship images...')
  const symphonyShip = ships.find((s) => s.name === 'Symphony of the Seas')
  if (symphonyShip) {
    await db
      .insert(cruiseShipImages)
      .values([
        {
          shipId: symphonyShip.id,
          imageUrl: 'https://example.com/symphony-hero.jpg',
          thumbnailUrl: 'https://example.com/symphony-hero-thumb.jpg',
          altText: 'Symphony of the Seas exterior view',
          imageType: 'hero',
          isHero: true,
          displayOrder: 0,
        },
        {
          shipId: symphonyShip.id,
          imageUrl: 'https://example.com/symphony-pool.jpg',
          altText: 'Pool deck',
          imageType: 'gallery',
          displayOrder: 1,
        },
      ])
      .onConflictDoNothing()
    console.log(`  ✓ Created images for ${symphonyShip.name}`)
  }

  // ============================================================================
  // SHIP DECKS (for first ship)
  // ============================================================================
  console.log('Creating ship decks...')
  if (symphonyShip) {
    await db
      .insert(cruiseShipDecks)
      .values([
        { shipId: symphonyShip.id, name: 'Deck 5 - Promenade', deckNumber: 5, displayOrder: 0 },
        { shipId: symphonyShip.id, name: 'Deck 8 - Pool Deck', deckNumber: 8, displayOrder: 1 },
        { shipId: symphonyShip.id, name: 'Deck 15 - Sports Deck', deckNumber: 15, displayOrder: 2 },
      ])
      .onConflictDoNothing()
    console.log(`  ✓ Created decks for ${symphonyShip.name}`)
  }

  // ============================================================================
  // SHIP CABIN TYPES (for first ship)
  // ============================================================================
  console.log('Creating cabin types...')
  if (symphonyShip) {
    await db
      .insert(cruiseShipCabinTypes)
      .values([
        {
          shipId: symphonyShip.id,
          cabinCode: 'IA',
          cabinCategory: 'inside',
          name: 'Interior Stateroom',
          defaultOccupancy: 2,
        },
        {
          shipId: symphonyShip.id,
          cabinCode: 'OV',
          cabinCategory: 'oceanview',
          name: 'Ocean View Stateroom',
          defaultOccupancy: 2,
        },
        {
          shipId: symphonyShip.id,
          cabinCode: 'BL',
          cabinCategory: 'balcony',
          name: 'Balcony Stateroom',
          defaultOccupancy: 2,
        },
        {
          shipId: symphonyShip.id,
          cabinCode: 'GS',
          cabinCategory: 'suite',
          name: 'Grand Suite',
          defaultOccupancy: 2,
        },
      ])
      .onConflictDoNothing()
    console.log(`  ✓ Created cabin types for ${symphonyShip.name}`)
  }

  // ============================================================================
  // SAILINGS
  // ============================================================================
  console.log('Creating sailings...')
  const miamiPort = ports.find((p) => p.slug === 'miami-florida')
  const nassauPort = ports.find((p) => p.slug === 'nassau-bahamas')

  if (!symphonyShip || !rciLine || !miamiPort || !caribbeanRegion) {
    console.error('Missing required reference data for sailings')
    process.exit(1)
  }

  // Sailing 1: With prices
  const [sailing1] = await db
    .insert(cruiseSailings)
    .values({
      provider: 'traveltek',
      providerIdentifier: 'TEST-001',
      shipId: symphonyShip.id,
      cruiseLineId: rciLine.id,
      embarkPortId: miamiPort.id,
      disembarkPortId: miamiPort.id,
      name: '7 Night Western Caribbean',
      embarkPortName: miamiPort.name,
      disembarkPortName: miamiPort.name,
      sailDate: '2025-03-15',
      endDate: '2025-03-22',
      nights: 7,
      // Price summaries will be set after cabin prices are inserted
      cheapestInsideCents: 89900, // $899 CAD
      cheapestOceanviewCents: 119900,
      cheapestBalconyCents: 159900,
      cheapestSuiteCents: 299900,
    })
    .onConflictDoNothing()
    .returning()

  // Sailing 2: NO PRICES (tests NULL cheapest_* handling)
  const [sailing2] = await db
    .insert(cruiseSailings)
    .values({
      provider: 'traveltek',
      providerIdentifier: 'TEST-002-NO-PRICES',
      shipId: symphonyShip.id,
      cruiseLineId: rciLine.id,
      embarkPortId: miamiPort.id,
      disembarkPortId: miamiPort.id,
      name: '5 Night Bahamas - No Prices Available',
      embarkPortName: miamiPort.name,
      disembarkPortName: miamiPort.name,
      sailDate: '2025-04-01',
      endDate: '2025-04-06',
      nights: 5,
      // ALL NULL - no prices available
      cheapestInsideCents: null,
      cheapestOceanviewCents: null,
      cheapestBalconyCents: null,
      cheapestSuiteCents: null,
    })
    .onConflictDoNothing()
    .returning()

  const s1 =
    sailing1 ||
    (await db.select().from(cruiseSailings).where(eq(cruiseSailings.providerIdentifier, 'TEST-001')))[0]
  const s2 =
    sailing2 ||
    (
      await db
        .select()
        .from(cruiseSailings)
        .where(eq(cruiseSailings.providerIdentifier, 'TEST-002-NO-PRICES'))
    )[0]

  console.log(`  ✓ Created sailing: ${s1?.name} (with prices)`)
  console.log(`  ✓ Created sailing: ${s2?.name} (NO prices - NULL test)`)

  // ============================================================================
  // SAILING REGIONS
  // ============================================================================
  if (s1 && caribbeanRegion) {
    await db
      .insert(cruiseSailingRegions)
      .values({ sailingId: s1.id, regionId: caribbeanRegion.id, isPrimary: true })
      .onConflictDoNothing()
    console.log(`  ✓ Linked ${s1.name} to ${caribbeanRegion.name} region`)
  }

  // ============================================================================
  // SAILING STOPS (including SEA DAYS)
  // ============================================================================
  console.log('Creating sailing stops (including sea days)...')
  if (s1 && miamiPort && nassauPort) {
    await db
      .insert(cruiseSailingStops)
      .values([
        // Day 1: Embark Miami
        {
          sailingId: s1.id,
          portId: miamiPort.id,
          portName: miamiPort.name,
          isSeaDay: false,
          dayNumber: 1,
          sequenceOrder: 0,
          departureTime: '17:00',
        },
        // Day 2: SEA DAY (NULL port_id, "At Sea" name)
        {
          sailingId: s1.id,
          portId: null, // NULL for sea day
          portName: 'At Sea', // Required "At Sea" text
          isSeaDay: true,
          dayNumber: 2,
          sequenceOrder: 0,
        },
        // Day 3: Nassau
        {
          sailingId: s1.id,
          portId: nassauPort.id,
          portName: nassauPort.name,
          isSeaDay: false,
          dayNumber: 3,
          sequenceOrder: 0,
          arrivalTime: '08:00',
          departureTime: '17:00',
        },
        // Day 4: SEA DAY
        {
          sailingId: s1.id,
          portId: null,
          portName: 'At Sea',
          isSeaDay: true,
          dayNumber: 4,
          sequenceOrder: 0,
        },
        // Day 5: SEA DAY
        {
          sailingId: s1.id,
          portId: null,
          portName: 'At Sea',
          isSeaDay: true,
          dayNumber: 5,
          sequenceOrder: 0,
        },
        // Day 6: Nassau again
        {
          sailingId: s1.id,
          portId: nassauPort.id,
          portName: nassauPort.name,
          isSeaDay: false,
          dayNumber: 6,
          sequenceOrder: 0,
          arrivalTime: '07:00',
          departureTime: '14:00',
        },
        // Day 7: Return to Miami
        {
          sailingId: s1.id,
          portId: miamiPort.id,
          portName: miamiPort.name,
          isSeaDay: false,
          dayNumber: 7,
          sequenceOrder: 0,
          arrivalTime: '06:00',
        },
      ])
      .onConflictDoNothing()
    console.log(`  ✓ Created 7 stops for ${s1.name} (3 sea days with NULL port_id)`)
  }

  // ============================================================================
  // CABIN PRICES (CAD canonical)
  // ============================================================================
  console.log('Creating cabin prices (CAD canonical)...')
  if (s1) {
    await db
      .insert(cruiseSailingCabinPrices)
      .values([
        {
          sailingId: s1.id,
          cabinCode: 'IA',
          cabinCategory: 'inside',
          occupancy: 2,
          basePriceCents: 89900, // $899 CAD
          taxesCents: 15000, // $150 CAD taxes
          originalCurrency: 'CAD',
          originalAmountCents: 89900,
        },
        {
          sailingId: s1.id,
          cabinCode: 'OV',
          cabinCategory: 'oceanview',
          occupancy: 2,
          basePriceCents: 119900,
          taxesCents: 15000,
          originalCurrency: 'CAD',
          originalAmountCents: 119900,
        },
        {
          sailingId: s1.id,
          cabinCode: 'BL',
          cabinCategory: 'balcony',
          occupancy: 2,
          basePriceCents: 159900,
          taxesCents: 15000,
          originalCurrency: 'CAD',
          originalAmountCents: 159900,
        },
        {
          sailingId: s1.id,
          cabinCode: 'GS',
          cabinCategory: 'suite',
          occupancy: 2,
          basePriceCents: 299900,
          taxesCents: 25000,
          originalCurrency: 'CAD',
          originalAmountCents: 299900,
        },
      ])
      .onConflictDoNothing()
    console.log(`  ✓ Created 4 cabin prices for ${s1.name}`)
  }

  console.log('\n✅ Cruise data seed complete!')
  console.log('\nSummary:')
  console.log('  - 2 cruise lines')
  console.log('  - 2 regions')
  console.log('  - 3 ports')
  console.log('  - 3 ships (1 with images, decks, cabin types)')
  console.log('  - 2 sailings:')
  console.log('    - 1 with prices (4 cabin categories)')
  console.log('    - 1 WITHOUT prices (NULL cheapest_* test)')
  console.log('  - 7 stops (3 sea days with NULL port_id, "At Sea" name)')

  await client.end()
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
