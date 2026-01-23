# Cruise System Architecture

This document describes the complete cruise booking architecture, covering both the FTP catalog sync system and the FusionAPI live booking integration.

## System Overview

The Tailfire platform uses two complementary Traveltek systems for cruise functionality:

| System | Purpose | Data Type | Update Frequency |
|--------|---------|-----------|------------------|
| **Cruise Catalog** (FTP) | Browse, search, display | Static | Daily (2 AM sync) |
| **FusionAPI** | Book, price, availability | Live/Real-time | On-demand |

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CRUISE DATA FLOW                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────────────┐                    ┌─────────────────┐            │
│   │  Traveltek FTP  │                    │  Traveltek      │            │
│   │  Server         │                    │  FusionAPI      │            │
│   │  (ftpeu1prod)   │                    │  (fusionapi)    │            │
│   └────────┬────────┘                    └────────┬────────┘            │
│            │                                      │                      │
│            │ Daily Sync                           │ Real-time            │
│            │ (2 AM EST)                           │ (On-demand)          │
│            ▼                                      ▼                      │
│   ┌─────────────────┐                    ┌─────────────────┐            │
│   │  Cruise Import  │                    │  Cruise Booking │            │
│   │  Module         │                    │  Module         │            │
│   │  (IMPLEMENTED)  │                    │  (TODO)         │            │
│   └────────┬────────┘                    └────────┬────────┘            │
│            │                                      │                      │
│            │ Stores                               │ Uses for             │
│            │ catalog data                         │ live queries         │
│            ▼                                      ▼                      │
│   ┌─────────────────────────────────────────────────────────┐           │
│   │                     DATABASE                             │           │
│   │                                                          │           │
│   │  catalog.cruise_sailings.provider_identifier             │           │
│   │                        ║                                 │           │
│   │                        ║ codetocruiseid                  │           │
│   │                        ║ (THE CRITICAL LINK)             │           │
│   │                        ▼                                 │           │
│   │              Links FTP data to FusionAPI                 │           │
│   └─────────────────────────────────────────────────────────┘           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## The Critical Link: `codetocruiseid`

The `codetocruiseid` is Traveltek's globally unique sailing identifier. It serves as the bridge between:
- **FTP Catalog**: Extracted from file path, stored in database
- **FusionAPI**: Passed as query parameter for live operations

### How `codetocruiseid` Flows Through the System

```
FTP FILE PATH                          DATABASE                         FUSIONAPI
─────────────────                      ────────                         ─────────
/2026/02/1/180/2089722.json   ──►   cruise_sailings             ──►   ?codetocruiseid=2089722
       │                              provider_identifier
       │                              = "2089722"
       └── filename = codetocruiseid
```

### FTP Path Structure
```
/year/month/lineid/shipid/codetocruiseid.json

Example: /2026/02/1/180/2089722.json
         │    │  │  │   └── codetocruiseid (sailing ID)
         │    │  │  └────── shipid (180 = specific ship)
         │    │  └───────── lineid (1 = cruise line)
         │    └──────────── month (February)
         └───────────────── year (2026)
```

### Database Storage
```sql
-- The codetocruiseid is stored as provider_identifier
SELECT id, provider, provider_identifier, ship_name, departure_date
FROM catalog.cruise_sailings
WHERE provider = 'traveltek'
  AND provider_identifier = '2089722';

-- Unique constraint ensures no duplicates
UNIQUE (provider, provider_identifier)
```

### FusionAPI Usage
```bash
# Use codetocruiseid to query live availability/pricing
GET /cruiseresults.pl?codetocruiseid=2089722&sid={SID}&requestid={TOKEN}
GET /cruisecabingrades.pl?codetocruiseid=2089722&resultno=1&sessionkey={UUID}
```

---

## System 1: Cruise Catalog (FTP Import) - IMPLEMENTED

### Overview

The Cruise Import module syncs static catalog data from Traveltek's FTP server.

| Property | Value |
|----------|-------|
| **Location** | `apps/api/src/cruise-import/` |
| **FTP Server** | `ftpeu1prod.traveltek.net` |
| **Schedule** | Daily at 2 AM EST |
| **Data Format** | JSON files |
| **Status** | Fully implemented |

### Database Schema (16 tables in `catalog.*`)

#### Core Entities
| Table | Description | Key Fields |
|-------|-------------|------------|
| `cruise_sailings` | Main sailing entity | `provider_identifier` (codetocruiseid) |
| `cruise_ships` | Ship details | `provider_ship_id`, `name`, `tonnage` |
| `cruise_lines` | Cruise line companies | `provider_line_id`, `name`, `logo_url` |
| `cruise_ports` | Port information | `port_code`, `name`, `country` |
| `cruise_regions` | Geographic regions | `name`, `description` |

#### Sailing Details
| Table | Description |
|-------|-------------|
| `cruise_sailing_stops` | Itinerary ports of call |
| `cruise_sailing_regions` | Regions visited by sailing |
| `cruise_sailing_cabin_prices` | Base pricing per cabin type |
| `cruise_alternate_sailings` | Related sailings |

#### Ship Details
| Table | Description |
|-------|-------------|
| `cruise_ship_cabin_types` | Cabin categories per ship |
| `cruise_ship_decks` | Deck layouts |
| `cruise_ship_images` | Ship photos |
| `cruise_cabin_images` | Cabin photos |

#### Sync Infrastructure
| Table | Description |
|-------|-------------|
| `cruise_ftp_file_sync` | Tracks synced files (delta sync) |
| `cruise_sync_raw` | Raw JSON storage |
| `cruise_sync_history` | Sync operation logs |

### Data Flow

```
1. FTP Connection
   └── Connect to ftpeu1prod.traveltek.net

2. File Discovery
   └── List directories: /year/month/lineid/shipid/
       └── Find JSON files (codetocruiseid.json)

3. Delta Sync
   └── Check cruise_ftp_file_sync for last modified
       └── Only download changed/new files

4. JSON Parsing
   └── Extract sailing data from JSON
       └── Map to database schema

5. Database Upsert
   └── Insert/update all related tables
       └── Maintain referential integrity

6. Sync History
   └── Record operation in cruise_sync_history
```

### API Endpoints

Protected by internal API key (`x-internal-api-key` header):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/cruise-import/test-connection` | GET | Test FTP connectivity |
| `/cruise-import/sync` | POST | Trigger manual sync |
| `/cruise-import/sync/status` | GET | Get current sync status |
| `/cruise-import/sync/cancel` | POST | Cancel running sync |
| `/cruise-import/sync/history` | GET | View sync history |
| `/cruise-import/storage-stats` | GET | Database statistics |

### Environment Variables

| Variable | Description |
|----------|-------------|
| `TRAVELTEK_FTP_HOST` | FTP server hostname |
| `TRAVELTEK_FTP_USER` | FTP username |
| `TRAVELTEK_FTP_PASSWORD` | FTP password |
| `INTERNAL_API_KEY` | API key for sync endpoints |
| `ENABLE_SCHEDULED_CRUISE_SYNC` | Enable daily cron (`true`/`false`) |

---

## System 2: FusionAPI (Live Booking) - TO BE IMPLEMENTED

### Overview

The FusionAPI provides real-time cruise availability, pricing, and booking capabilities.

| Property | Value |
|----------|-------|
| **Location** | `apps/api/src/cruise-booking/` (README only) |
| **Base URL** | `https://fusionapi.traveltek.net/2.1/json/` |
| **Protocol** | HTTPS with OAuth 2.0 |
| **Status** | Documentation exists, no implementation |

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      OAUTH AUTHENTICATION FLOW                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Step 1: Get Access Token                                           │
│  ─────────────────────────                                          │
│                                                                      │
│  POST /token.pl                                                      │
│  Authorization: Basic {base64(username:password)}                   │
│  Content-Type: application/x-www-form-urlencoded                    │
│                                                                      │
│  Body: grant_type=client_credentials&scope=portal                   │
│                                                                      │
│  Response: { "access_token": "xxx", "expires_in": 3600 }            │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Step 2: Make API Requests                                          │
│  ─────────────────────────                                          │
│                                                                      │
│  GET requests:  Pass token as `requestid` query parameter           │
│  POST requests: Pass token as `requestid` header                    │
│                                                                      │
│  Required parameters:                                                │
│  • sid={TRAVELTEK_SID}      - Account identifier                    │
│  • requestid={access_token} - The OAuth token                       │
│  • sessionkey={UUID}        - Session state (stateful API)          │
│                                                                      │
│  Example:                                                            │
│  GET /cruiseresults.pl?sid=52426&requestid={token}&adults=2         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Booking Flow (9 Steps)

```
┌─────────────────┐
│  1. SEARCH      │  cruiseresults.pl
│                 │  • Input: dates, destinations, passengers
│                 │  • Output: codetocruiseid, resultno
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. RATE CODES  │  cruiseratecodes.pl
│                 │  • Input: codetocruiseid, resultno
│                 │  • Output: Available fare types
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  3. CABIN       │  cruisecabingrades.pl
│     GRADES      │  • Input: codetocruiseid, resultno
│                 │  • Output: gradeno, LIVE pricing
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  4. PRICING     │  cruisecabingradebreakdown.pl
│     BREAKDOWN   │  • Input: codetocruiseid, gradeno
│                 │  • Output: Detailed fare breakdown
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  5. SPECIFIC    │  cruisecabins.pl (optional)
│     CABINS      │  • Input: codetocruiseid, gradeno
│                 │  • Output: Specific cabin numbers
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  6. PAX DATA    │  cruisegetpaxdata.pl (optional)
│                 │  • Input: cruiseline, pastpaxid
│                 │  • Output: Past passenger info
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  7. ADD TO      │  basketadd.pl
│     BASKET      │  • Input: codetocruiseid, gradeno, farecode
│                 │  • Output: itemkey, sessionkey
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  8. REVIEW      │  basket.pl
│     BASKET      │  • Input: sessionkey
│                 │  • Output: Basket contents, totals
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  9. CREATE      │  book.pl
│     BOOKING     │  • Input: sessionkey, passengers, payment
│                 │  • Output: Booking reference
└─────────────────┘
```

### Session Management

FusionAPI is **stateful**. The `sessionkey` (UUID) maintains context:

- Created on first search request
- Must be passed to all subsequent calls
- Links search results to basket operations
- Valid for 2+ hours of inactivity
- Lost sessions require starting over

### Environment Variables

| Variable | Description | Source |
|----------|-------------|--------|
| `TRAVELTEK_API_URL` | FusionAPI base URL | Doppler |
| `TRAVELTEK_USERNAME` | OAuth username | Doppler |
| `TRAVELTEK_PASSWORD` | OAuth password | Doppler |
| `TRAVELTEK_SID` | Site ID (account identifier) | Doppler |

---

## Data Classification: Static vs Live

| Data Type | Source | Frequency | Storage | Use Case |
|-----------|--------|-----------|---------|----------|
| Ship details | FTP | Weekly | `catalog.cruise_ships` | Display, filtering |
| Line info | FTP | Monthly | `catalog.cruise_lines` | Display, branding |
| Ports | FTP | Monthly | `catalog.cruise_ports` | Itinerary display |
| Itineraries | FTP | Daily | `catalog.cruise_sailing_stops` | Route preview |
| **Base prices** | FTP | Daily | `catalog.cruise_sailings.cheapest_*` | Search sorting |
| **LIVE availability** | FusionAPI | Real-time | Not stored | Booking flow |
| **LIVE pricing** | FusionAPI | Real-time | Not stored | Booking flow |
| **Cabin selection** | FusionAPI | Real-time | Not stored | Booking flow |
| **Booking status** | FusionAPI | Real-time | Confirmation only | Post-booking |

### Key Insight: Price Discrepancies

FTP prices are **estimated/cached**. FusionAPI prices are **live/authoritative**.

```
FTP Catalog: cheapest_inside = $499 (synced yesterday)
FusionAPI:   actualPrice = $549 (real-time)
```

**Strategy**: Display FTP prices with "from $X" disclaimer. Show live prices during booking flow.

---

## Proposed Implementation: cruise-booking Module

### Architecture

```
apps/api/src/cruise-booking/
├── cruise-booking.module.ts           # NestJS module
├── cruise-booking.controller.ts       # HTTP endpoints
├── dto/
│   ├── search.dto.ts                  # Search request/response
│   ├── cabin-grade.dto.ts             # Cabin pricing DTOs
│   ├── basket.dto.ts                  # Basket DTOs
│   └── booking.dto.ts                 # Booking DTOs
├── services/
│   ├── traveltek-auth.service.ts      # OAuth token management
│   ├── fusion-api.service.ts          # API client wrapper
│   ├── session.service.ts             # Session state management
│   ├── basket.service.ts              # Basket operations
│   └── booking.service.ts             # Booking creation
└── types/
    └── fusion-api.types.ts            # TypeScript interfaces
```

### Service Responsibilities

#### TraveltekAuthService
```typescript
// Token management with caching
class TraveltekAuthService {
  getAccessToken(): Promise<string>    // Get token (from cache or fresh)
  refreshToken(): Promise<string>      // Force refresh
  isTokenValid(): boolean              // Check expiry
}

// Token caching options:
// - In-memory: Simple, loses token on restart
// - Redis: Multi-instance safe, recommended for prod
```

#### FusionApiService
```typescript
// Low-level API client
class FusionApiService {
  search(params: SearchParams, sessionkey?: string): Promise<SearchResult>
  getRateCodes(codetocruiseid: string, resultno: number, sessionkey: string)
  getCabinGrades(codetocruiseid: string, resultno: number, sessionkey: string)
  getCabinBreakdown(codetocruiseid: string, gradeno: number, sessionkey: string)
  getCabins(codetocruiseid: string, gradeno: number, sessionkey: string)
}
```

#### SessionService
```typescript
// Session state management
class SessionService {
  createSession(userId: string): Promise<SessionState>
  getSession(sessionkey: string): Promise<SessionState>
  updateSession(sessionkey: string, data: Partial<SessionState>): Promise<void>

  // Option: Store sessions in database for persistence across restarts
}
```

#### BasketService
```typescript
// Basket operations
class BasketService {
  addToBasket(sessionkey: string, selection: CabinSelection): Promise<BasketItem>
  getBasket(sessionkey: string): Promise<Basket>
  removeFromBasket(sessionkey: string, itemkey: string): Promise<void>
}
```

#### BookingService
```typescript
// Booking creation
class BookingService {
  createBooking(sessionkey: string, passengers: Passenger[], payment: Payment): Promise<BookingConfirmation>

  // Store confirmation in local database for records
  saveConfirmation(booking: BookingConfirmation): Promise<void>
}
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/cruise-booking/search` | POST | Search cruises with live availability |
| `/cruise-booking/rates/:codetocruiseid` | GET | Get rate codes for sailing |
| `/cruise-booking/cabins/:codetocruiseid` | GET | Get cabin grades + pricing |
| `/cruise-booking/cabin-breakdown` | GET | Detailed price breakdown |
| `/cruise-booking/basket` | GET | Get current basket |
| `/cruise-booking/basket/add` | POST | Add to basket |
| `/cruise-booking/basket/remove` | DELETE | Remove from basket |
| `/cruise-booking/book` | POST | Create booking |

### Integration Flow

```
1. User browses catalog (FTP data)
   └── Database: catalog.cruise_sailings

2. User selects cruise
   └── Get provider_identifier (codetocruiseid)

3. Show live availability
   └── FusionAPI: cruiseresults.pl?codetocruiseid=XXX

4. User selects cabin
   └── FusionAPI: cruisecabingrades.pl → cruisecabingradebreakdown.pl

5. Add to basket
   └── FusionAPI: basketadd.pl

6. Complete booking
   └── FusionAPI: book.pl
   └── Store confirmation in local DB
```

---

## Implementation Priorities

### Phase 1: Authentication & Search
1. Implement `TraveltekAuthService` with token caching
2. Implement `FusionApiService.search()`
3. Create search endpoint that validates `codetocruiseid` against catalog

### Phase 2: Pricing & Cabins
1. Implement rate codes and cabin grades endpoints
2. Add session management
3. Show live pricing alongside FTP base prices

### Phase 3: Basket & Booking
1. Implement basket operations
2. Implement booking creation
3. Store confirmations in database

### Phase 4: Error Handling & Edge Cases
1. Handle FusionAPI downtime (fallback to quote request?)
2. Handle price discrepancies
3. Handle sold-out cabins
4. Rate limiting protection

---

## Security Considerations

### Token Handling
- OAuth tokens passed as `requestid` query parameter appear in logs
- Consider using POST methods where possible (token in header)
- Never log full tokens; truncate for debugging

### Credential Storage
- All credentials in Doppler (never in code/docs)
- Separate credentials per environment (dev/stg/prd)
- Rotate credentials if exposed

### Session Security
- Sessions are stateful server-side
- Don't expose raw `sessionkey` to frontend
- Consider mapping internal session IDs to FusionAPI sessionkeys

---

## FDW Architecture (Cross-Environment)

For catalog data sharing across environments:

| Environment | Cruise Data Source |
|-------------|-------------------|
| Production | Local `catalog` schema (source of truth) |
| Preview/Dev | FDW → Production's `catalog` schema |
| Local Dev | Local `catalog` schema (may drift) |

See `CLAUDE.md` for FDW details and sync commands.

---

## Related Documentation

- [Cruise Import README](../apps/api/src/cruise-import/README.md) - FTP sync details
- [Cruise Booking README](../apps/api/src/cruise-booking/README.md) - FusionAPI documentation
- [Deployment Guide](./DEPLOYMENT_API.md) - Environment configuration
- [Traveltek FusionAPI Docs](https://docs.traveltek.com/FKpitwn16WopwZdCaW17) - Official API reference
