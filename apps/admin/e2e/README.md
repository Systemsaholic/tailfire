# E2E Tests - Setup Notes

## Status

The Playwright E2E test suite in `trip-lifecycle.spec.ts` has been created but requires the following UI components to be implemented before it can run successfully:

## Prerequisites for Running E2E Tests

### 1. Trip Creation Form
The following components need to be built:
- Trip creation form at `/trips` with "New Trip" button
- Form fields: trip name, trip type (dropdown), start date, end date, primary contact (dropdown)
- Form submission that creates trip and navigates to trip detail page

### 2. Trip Detail Page
Required elements:
- Trip reference number display with `data-testid="trip-reference-number"`
- Status display and status change dropdown with confirmation
- Edit trip functionality
- Traveler snapshot comparison (already implemented: `TravelerSnapshotComparison`)

### 3. Contact Detail Page
Required elements:
- First booking date display with `data-testid="first-booking-date"`

## Running the Tests

Once the UI is implemented, run the tests with:

```bash
# Run all E2E tests
pnpm test:e2e

# Run with UI mode (recommended for development)
pnpm test:e2e:ui

# Run in headed mode (see browser)
pnpm test:e2e:headed
```

## CI Integration

Until the prerequisite UI components are built, add a feature flag or env check:

```bash
# In CI pipeline
if [ "$E2E_TESTS_ENABLED" = "true" ]; then
  pnpm --filter @tailfire/admin test:e2e
else
  echo "E2E tests skipped - UI components not yet implemented"
  exit 0
fi
```

**Important**: Once UI is complete, set `E2E_TESTS_ENABLED=true` in CI to make these tests **required**. This ensures CI won't mask real failures with `continue-on-error`.

## Current Implementation Status

✅ **Backend API** - Fully implemented and tested
- Trip creation, status transitions, reference numbers
- First booking date logic
- Traveler snapshots

✅ **Snapshot Comparison Component** - Implemented
- `TravelerSnapshotComparison.tsx`
- `snapshot-utils.ts` (pure helpers)
- `use-traveler-snapshot-diff.ts` (React hooks)

⏳ **Trip Creation Form** - Not yet implemented
⏳ **Trip Detail Page** - Partially implemented (trip overview exists but missing status controls)
⏳ **Contact Detail Page** - Not yet implemented

## Test Coverage

The E2E test suite covers:

1. **Full Lifecycle Workflow** - Create trip, transition through all statuses, verify in completed list
2. **Invalid Transitions** - Verify business rules prevent invalid status changes
3. **Snapshot Comparison** - Verify UI displays when contact info changes
4. **First Booking Date** - Verify contact gets first booking date when trip is booked
5. **Reference Number Behavior** - Verify regeneration in draft, immutability after

## Notes

- Tests are written to spec and serve as documentation of expected behavior
- Once UI is implemented, these tests will validate the entire user journey
- Tests use realistic selectors (role-based) for accessibility
- Data-testid attributes should be added to key elements for reliable selection
