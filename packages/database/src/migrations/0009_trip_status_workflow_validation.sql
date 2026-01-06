-- ============================================================================
-- Trip Status Workflow Validation
-- ============================================================================
-- Migration 0009: Enforces valid status transitions at the database level
--
-- Implements the same workflow logic defined in:
-- packages/shared-types/src/api/trip-status-transitions.ts
--
-- Status Transition Rules:
-- - Draft → Quoted, Booked, Cancelled
-- - Quoted → Draft, Booked, Cancelled
-- - Booked → In Progress, Completed, Cancelled
-- - In Progress → Completed, Cancelled
-- - Completed → [terminal state - no transitions]
-- - Cancelled → [terminal state - no transitions]
--
-- IMPORTANT: Keep this SQL in sync with trip-status-transitions.ts
-- When modifying transition rules, update BOTH files
-- ============================================================================

-- Create function to validate trip status transitions
CREATE OR REPLACE FUNCTION validate_trip_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow no-op updates (status hasn't changed)
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Validate transitions from 'draft'
  -- Valid: quoted, booked, cancelled
  IF OLD.status = 'draft' THEN
    IF NEW.status NOT IN ('quoted', 'booked', 'cancelled') THEN
      RAISE EXCEPTION 'Cannot transition from Draft to %. Valid transitions: Quoted, Booked, Cancelled', NEW.status;
    END IF;
    RETURN NEW;
  END IF;

  -- Validate transitions from 'quoted'
  -- Valid: draft, booked, cancelled
  IF OLD.status = 'quoted' THEN
    IF NEW.status NOT IN ('draft', 'booked', 'cancelled') THEN
      RAISE EXCEPTION 'Cannot transition from Quoted to %. Valid transitions: Draft, Booked, Cancelled', NEW.status;
    END IF;
    RETURN NEW;
  END IF;

  -- Validate transitions from 'booked'
  -- Valid: in_progress, completed, cancelled
  IF OLD.status = 'booked' THEN
    IF NEW.status NOT IN ('in_progress', 'completed', 'cancelled') THEN
      RAISE EXCEPTION 'Cannot transition from Booked to %. Valid transitions: In Progress, Completed, Cancelled', NEW.status;
    END IF;
    RETURN NEW;
  END IF;

  -- Validate transitions from 'in_progress'
  -- Valid: completed, cancelled
  IF OLD.status = 'in_progress' THEN
    IF NEW.status NOT IN ('completed', 'cancelled') THEN
      RAISE EXCEPTION 'Cannot transition from In Progress to %. Valid transitions: Completed, Cancelled', NEW.status;
    END IF;
    RETURN NEW;
  END IF;

  -- Terminal state: 'completed'
  -- No transitions allowed
  IF OLD.status = 'completed' THEN
    RAISE EXCEPTION 'Cannot transition from Completed to %. Completed is a terminal state.', NEW.status;
  END IF;

  -- Terminal state: 'cancelled'
  -- No transitions allowed
  IF OLD.status = 'cancelled' THEN
    RAISE EXCEPTION 'Cannot transition from Cancelled to %. Cancelled is a terminal state.', NEW.status;
  END IF;

  -- Fallback: If we somehow reach here, allow the transition
  -- (This should never happen if all statuses are covered above)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

-- Create trigger to validate status transitions on UPDATE
-- Only fires when status column is actually being changed
CREATE TRIGGER trip_status_transition_validation
  BEFORE UPDATE ON trips
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION validate_trip_status_transition();
--> statement-breakpoint

-- Add comment to document the status workflow
COMMENT ON COLUMN trips.status IS 'Trip status following strict workflow: draft → quoted → booked → in_progress → completed/cancelled. Enforced by trigger. Terminal states: completed, cancelled.';
