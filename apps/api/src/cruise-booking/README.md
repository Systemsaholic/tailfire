# Traveltek FusionAPI - Cruise Booking Module

This module handles real-time cruise booking operations via the Traveltek FusionAPI V2.1. It works in conjunction with the Cruise Import module (FTP-based catalogue) to provide a complete cruise booking solution.

## Overview

| Component | Purpose |
|-----------|---------|
| **Cruise Import** (FTP) | Fetches cruise catalogue data for search/display |
| **Cruise Booking** (FusionAPI) | Real-time availability, pricing, and booking |

## FusionAPI Basics

- **Base URL**: `https://fusionapi.traveltek.net/2.1/json/<endpoint>.pl`
- **Protocol**: HTTPS (required)
- **Format**: JSON requests and responses
- **Authentication**: OAuth 2.0 Client Credentials

## Authentication

The FusionAPI uses a two-part authentication:
1. **OAuth 2.0 Token** - Get an access token using Basic Auth
2. **API Requests** - Pass both `sid` and `requestid` parameters

### Step 1: Get OAuth Token

```
POST https://fusionapi.traveltek.net/2.1/json/token.pl
Authorization: Basic {base64(username:password)}
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&scope=portal
```

**Response:**
```json
{
  "access_token": "cc8ed5bet9cf5-4de5-ac04-09ed6bfdd8c3",
  "token_type": "bearer",
  "expires_in": 7200
}
```

### Step 2: Make API Requests

Include **both** `sid` and `requestid` as query parameters:

```
GET https://fusionapi.traveltek.net/2.1/json/cruiseresults.pl?sid={SID}&requestid={access_token}&adults=2
```

| Parameter | Description |
|-----------|-------------|
| `sid` | Site ID (account identifier) - from `TRAVELTEK_SID` env var |
| `requestid` | The `access_token` from Step 1 |

**Note:** The token is passed as a query parameter (`requestid`), NOT as a Bearer token header.

## Session Management

The FusionAPI is **stateful** and uses a `sessionkey` (string, up to 100 chars) to maintain context across requests.

### Two Expiry Times

| Expiry | Duration | Purpose |
|--------|----------|---------|
| **Session** | 2+ hours | FusionAPI stateful context |
| **Cabin Hold** | 15-30 min | Inventory reservation when added to basket |

- The `sessionkey` links search results to basket operations
- Always pass the same `sessionkey` throughout a booking flow
- **Note:** Cabin holds expire faster than sessions. Display countdown to client.

## Booking Flow

```
┌─────────────────┐
│  1. Search      │  cruiseresults.pl
│  Cruises        │  → Returns codetocruiseid, resultno
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. Get Rate    │  cruiseratecodes.pl
│  Codes          │  → Returns available fare types
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  3. Get Cabin   │  cruisecabingrades.pl
│  Grades         │  → Returns gradeno, pricing
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  4. Get Cabins  │  cruisecabins.pl (optional)
│  (Specific)     │  → Returns specific cabin numbers
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  5. Add to      │  basketadd.pl
│  Basket         │  → Returns itemkey, sessionkey
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  6. Review      │  basket.pl
│  Basket         │  → Returns basket contents, totals
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  7. Create      │  book.pl
│  Booking        │  → Returns booking reference
└─────────────────┘
```

## API Endpoints

### 1. Cruise Search

Search for available cruises.

```
GET /cruiseresults.pl?sid={SID}&requestid={TOKEN}&sessionkey={UUID}&adults=2&startdate=2026-02-01&enddate=2026-03-01
```

> **Note:** All parameters including authentication (`sid`, `requestid`) are passed as query parameters for GET requests.

**Key Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `sid` | String | **Required.** Site ID from `TRAVELTEK_SID` |
| `requestid` | String | **Required.** OAuth access token |
| `sessionkey` | String | Session identifier (create new or reuse) |
| `startdate` | Date | Departure date (YYYY-MM-DD) |
| `enddate` | Date | Latest departure date |
| `destinations` | String | Destination codes (comma-separated) |
| `cruiseline` | String | Cruise line code |
| `ship` | String | Ship code |
| `nights_min` | Integer | Minimum cruise nights |
| `nights_max` | Integer | Maximum cruise nights |
| `adults` | Integer | Number of adults |
| `children` | Integer | Number of children |

**Response includes:**
- `codetocruiseid` - Unique cruise identifier for subsequent calls
- `resultno` - Result number within search
- Sailing details (ship, itinerary, dates, ports)

### 2. Rate Codes

Get available rate/fare codes for a specific sailing.

```
GET /cruiseratecodes.pl?sid={SID}&requestid={TOKEN}&sessionkey={UUID}&codetocruiseid={ID}&resultno=1
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `sid` | String | **Required.** Site ID |
| `requestid` | String | **Required.** OAuth access token |
| `sessionkey` | String | Session identifier |
| `codetocruiseid` | String | From search results |
| `resultno` | Integer | From search results |

**Response includes:**
- Available fare types (refundable, non-refundable, promotions)
- Rate code identifiers for cabin grade requests

### 3. Cabin Grades

Get cabin categories and pricing.

```
GET /cruisecabingrades.pl?sid={SID}&requestid={TOKEN}&sessionkey={UUID}&codetocruiseid={ID}&resultno=1
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `sid` | String | **Required.** Site ID |
| `requestid` | String | **Required.** OAuth access token |
| `sessionkey` | String | Session identifier |
| `codetocruiseid` | String | From search results |
| `resultno` | Integer | From search results |
| `farecode` | String | Rate code (optional filter) |

**Response includes:**
- `gradeno` - Cabin grade identifier
- Category name and description
- Pricing per person and total
- Availability status

### 4. Cabin Grade Pricing Breakdown

Get detailed pricing breakdown for a cabin grade.

```
GET /cruisecabingradebreakdown.pl?sid={SID}&requestid={TOKEN}&sessionkey={UUID}&codetocruiseid={ID}&resultno=1&gradeno=1
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `sid` | String | **Required.** Site ID |
| `requestid` | String | **Required.** OAuth access token |
| `sessionkey` | String | Session identifier |
| `codetocruiseid` | String | From search results |
| `resultno` | Integer | From search results |
| `gradeno` | Integer | Cabin grade number |

**Response includes:**
- Base fare breakdown
- Taxes and fees
- Port charges
- Gratuities
- Total pricing

### 5. Specific Cabins

Get specific cabin numbers within a grade (if supported by cruise line).

```
GET /cruisecabins.pl?sid={SID}&requestid={TOKEN}&sessionkey={UUID}&codetocruiseid={ID}&resultno=1&gradeno=1
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `sid` | String | **Required.** Site ID |
| `requestid` | String | **Required.** OAuth access token |
| `sessionkey` | String | Session identifier |
| `codetocruiseid` | String | From search results |
| `resultno` | Integer | From search results |
| `gradeno` | Integer | Cabin grade number |

**Response includes:**
- Specific cabin numbers
- Deck location
- Cabin features

### 6. Passenger Data Lookup

Look up past passenger data (for returning customers).

```
GET /cruisegetpaxdata.pl?sid={SID}&requestid={TOKEN}&sessionkey={UUID}&cruiseline={CODE}&pastpaxid={ID}
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `sid` | String | **Required.** Site ID |
| `requestid` | String | **Required.** OAuth access token |
| `sessionkey` | String | Session identifier |
| `cruiseline` | String | Cruise line code |
| `pastpaxid` | String | Past passenger ID/loyalty number |

### 7. Add to Basket

Add a cruise selection to the booking basket.

```
GET /basketadd.pl?sid={SID}&requestid={TOKEN}&sessionkey={UUID}&codetocruiseid={ID}&resultno=1&gradeno=1&farecode={CODE}
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `sid` | String | **Required.** Site ID |
| `requestid` | String | **Required.** OAuth access token |
| `sessionkey` | String | Session identifier |
| `codetocruiseid` | String | From search results |
| `resultno` | Integer | From search results |
| `gradeno` | Integer | Selected cabin grade |
| `farecode` | String | Selected rate code |
| `cabinno` | String | Specific cabin (optional) |

**Response includes:**
- `itemkey` - Basket item identifier
- `sessionkey` - Session to use for subsequent calls
- Updated basket totals

### 8. Retrieve Basket

Get current basket contents and totals.

```
GET /basket.pl?sid={SID}&requestid={TOKEN}&sessionkey={UUID}
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `sid` | String | **Required.** Site ID |
| `requestid` | String | **Required.** OAuth access token |
| `sessionkey` | String | Session identifier |

**Response includes:**
- All items in basket
- Per-item pricing
- Total basket value
- Required passenger fields

### 9. Create Booking

Finalize the booking with passenger details.

```
POST /book.pl?sid={SID}
requestid: {TOKEN}
Content-Type: application/json
```

> **Note:** For POST requests, `requestid` is passed as a **header** (not query parameter). The `sid` remains as query parameter.

**Request Body:**
```json
{
  "sessionkey": "uuid-session-key",
  "passengers": [
    {
      "title": "Mr",
      "firstname": "John",
      "lastname": "Smith",
      "dateofbirth": "1980-05-15",
      "nationality": "US",
      "passportnumber": "123456789",
      "passportexpiry": "2030-01-01",
      "email": "john@example.com",
      "phone": "+1234567890"
    }
  ],
  "payment": {
    "type": "deposit",
    "amount": 500.00
  }
}
```

**Response includes:**
- Booking reference number
- Confirmation details
- Payment status

## Environment Variables

| Variable | Description | Source |
|----------|-------------|--------|
| `TRAVELTEK_API_URL` | FusionAPI base URL | Doppler |
| `TRAVELTEK_USERNAME` | OAuth username | Doppler |
| `TRAVELTEK_PASSWORD` | OAuth password | Doppler |
| `TRAVELTEK_SID` | Site ID for API requests | Doppler |

> **Note:** All Traveltek credentials are managed via Doppler. See [DEPLOYMENT_API.md](../../../docs/DEPLOYMENT_API.md) for environment configuration.

## Error Handling

The API returns errors in a consistent format:

```json
{
  "error": {
    "code": "INVALID_SESSION",
    "message": "Session has expired or is invalid"
  }
}
```

**Common Error Codes:**
| Code | Description | Resolution |
|------|-------------|------------|
| `INVALID_SESSION` | Session expired | Get new token, start new session |
| `INVALID_CREDENTIALS` | Auth failed | Check client_id/secret |
| `CRUISE_NOT_AVAILABLE` | Sailing unavailable | Refresh search results |
| `CABIN_NOT_AVAILABLE` | Cabin no longer available | Select different cabin |
| `VALIDATION_ERROR` | Invalid request params | Check request format |

## Integration with Cruise Import

```
┌──────────────────────────────────────────────────────────────┐
│                      Tailfire Platform                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐          ┌─────────────────┐           │
│  │  Cruise Import  │          │  Cruise Booking │           │
│  │  (FTP Module)   │          │  (FusionAPI)    │           │
│  ├─────────────────┤          ├─────────────────┤           │
│  │ • Catalogue     │          │ • Real-time     │           │
│  │   data sync     │◄────────►│   availability  │           │
│  │ • Ship/port     │          │ • Live pricing  │           │
│  │   information   │          │ • Booking       │           │
│  │ • Itineraries   │          │   creation      │           │
│  │ • Base pricing  │          │ • Basket mgmt   │           │
│  └────────┬────────┘          └────────┬────────┘           │
│           │                            │                     │
│           └──────────┬─────────────────┘                     │
│                      │                                       │
│                      ▼                                       │
│           ┌─────────────────┐                                │
│           │    Database     │                                │
│           │  (Supabase)     │                                │
│           └─────────────────┘                                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Workflow:**
1. **Cruise Import** syncs catalogue data nightly via FTP
2. Users search/browse using cached catalogue data
3. When user selects a cruise, **FusionAPI** confirms real-time availability
4. Pricing is validated against live FusionAPI data
5. Booking is created through FusionAPI
6. Confirmation stored in local database

## Testing the API

Validate credentials with these commands (credentials loaded from environment):

```bash
# 1. Get OAuth access token
# Credentials are loaded from Doppler environment variables
AUTH=$(echo -n "${TRAVELTEK_USERNAME}:${TRAVELTEK_PASSWORD}" | base64)
curl -X POST "${TRAVELTEK_API_URL}/token.pl" \
  -H "Authorization: Basic ${AUTH}" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Origin: http://localhost:3000" \
  -d "grant_type=client_credentials&scope=portal"

# Response: {"token_type":"bearer","expires_in":"7200","access_token":"..."}

# 2. Test cruise search (use token from step 1)
TOKEN="<access_token_from_step_1>"
curl "${TRAVELTEK_API_URL}/cruiseresults.pl?sid=${TRAVELTEK_SID}&requestid=${TOKEN}&adults=2&startdate=2026-02-01&enddate=2026-03-01" \
  -H "Accept: application/json"

# Should return JSON with cruise results
```

> **Note:** To run these commands locally, first load credentials with: `eval $(doppler secrets download --no-file --format=env -p tailfire -c dev)`

## Implementation Status

> **Status:** ✅ **IMPLEMENTED** (January 2026)
> See [CRUISE_ARCHITECTURE.md](../../../docs/CRUISE_ARCHITECTURE.md) for complete system documentation.

### Module Structure

```
cruise-booking/
├── cruise-booking.module.ts            # NestJS module with HttpModule
├── cruise-booking.controller.ts        # 10 endpoints with role-based guards
├── index.ts                            # Public exports
├── services/
│   ├── traveltek-auth.service.ts       # OAuth token caching (uses expires_in from response)
│   ├── fusion-api.service.ts           # Low-level HTTP client with retry logic
│   ├── booking-session.service.ts      # Session CRUD, handoff authorization, idempotency
│   └── booking.service.ts              # High-level orchestration
├── dto/
│   ├── search.dto.ts                   # Search request/response
│   ├── rate-code.dto.ts                # Rate code selection
│   ├── cabin-grade.dto.ts              # Cabin categories/grades
│   ├── cabin.dto.ts                    # Specific cabins + deck plans
│   ├── basket.dto.ts                   # Basket operations
│   └── booking.dto.ts                  # Passengers + preferences
└── types/
    └── fusion-api.types.ts             # FusionAPI type definitions
```

### API Endpoints (10 total)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/cruise-booking/search` | POST | Search cruises |
| `/cruise-booking/rates` | GET | Get rate codes |
| `/cruise-booking/cabin-grades` | GET | Get cabin grades |
| `/cruise-booking/cabins` | GET | Get cabins with deck plans |
| `/cruise-booking/basket` | POST | Add to basket (holds cabin) |
| `/cruise-booking/basket/:sessionId` | GET | Get basket contents |
| `/cruise-booking/basket/:sessionId/:itemkey` | DELETE | Remove from basket |
| `/cruise-booking/book` | POST | Complete booking |
| `/cruise-booking/proposal/:activityId` | GET | Get proposal (handoff flow) |
| `/cruise-booking/session/:sessionId` | DELETE | Cancel session |

### Database Tables

| Table | Purpose |
|-------|---------|
| `cruise_booking_sessions` | Ephemeral FusionAPI session state |
| `cruise_booking_idempotency` | Prevents double-bookings on retry (24h TTL) |
| `custom_cruise_details.fusion_booking_*` | Durable booking confirmation data |

### Booking Flows

| Flow | Description | Session Owner |
|------|-------------|---------------|
| **Agent** | Agent searches → proposes → books | Agent throughout |
| **Client Handoff** | Agent searches → proposes → Client books | Agent starts, Client continues |
| **OTA** | Client searches on OTA → books | Client throughout |

## Related Documentation

- [Cruise Architecture](../../../docs/CRUISE_ARCHITECTURE.md) - Complete system architecture (FTP + FusionAPI)
- [Cruise Import Module](../cruise-import/README.md) - FTP-based catalogue sync
- [Traveltek FusionAPI Docs](https://docs.traveltek.com/FKpitwn16WopwZdCaW17) - Official API documentation
