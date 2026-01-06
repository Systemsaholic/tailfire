/**
 * Unit Tests: Trip Status Transitions
 *
 * Tests the canTransitionTripStatus() helper to ensure it correctly validates
 * all legal and illegal state transitions according to the workflow:
 *
 * Draft → Quoted, Booked, Cancelled
 * Quoted → Draft, Booked, Cancelled
 * Booked → In Progress, Completed, Cancelled
 * In Progress → Completed, Cancelled
 * Completed → [terminal]
 * Cancelled → [terminal]
 */

import {
  canTransitionTripStatus,
  type TripStatus,
} from '../trip-status-transitions.js'

describe('canTransitionTripStatus', () => {
  describe('from DRAFT', () => {
    const from: TripStatus = 'draft'

    it('should allow transition to QUOTED', () => {
      expect(canTransitionTripStatus(from, 'quoted')).toBe(true)
    })

    it('should allow transition to BOOKED', () => {
      expect(canTransitionTripStatus(from, 'booked')).toBe(true)
    })

    it('should allow transition to CANCELLED', () => {
      expect(canTransitionTripStatus(from, 'cancelled')).toBe(true)
    })

    it('should reject transition to IN_PROGRESS', () => {
      expect(canTransitionTripStatus(from, 'in_progress')).toBe(false)
    })

    it('should reject transition to COMPLETED', () => {
      expect(canTransitionTripStatus(from, 'completed')).toBe(false)
    })

    it('should allow no-op (same status)', () => {
      expect(canTransitionTripStatus(from, 'draft')).toBe(true)
    })
  })

  describe('from QUOTED', () => {
    const from: TripStatus = 'quoted'

    it('should allow transition to DRAFT', () => {
      expect(canTransitionTripStatus(from, 'draft')).toBe(true)
    })

    it('should allow transition to BOOKED', () => {
      expect(canTransitionTripStatus(from, 'booked')).toBe(true)
    })

    it('should allow transition to CANCELLED', () => {
      expect(canTransitionTripStatus(from, 'cancelled')).toBe(true)
    })

    it('should reject transition to IN_PROGRESS', () => {
      expect(canTransitionTripStatus(from, 'in_progress')).toBe(false)
    })

    it('should reject transition to COMPLETED', () => {
      expect(canTransitionTripStatus(from, 'completed')).toBe(false)
    })

    it('should allow no-op (same status)', () => {
      expect(canTransitionTripStatus(from, 'quoted')).toBe(true)
    })
  })

  describe('from BOOKED', () => {
    const from: TripStatus = 'booked'

    it('should allow transition to IN_PROGRESS', () => {
      expect(canTransitionTripStatus(from, 'in_progress')).toBe(true)
    })

    it('should allow transition to COMPLETED', () => {
      expect(canTransitionTripStatus(from, 'completed')).toBe(true)
    })

    it('should allow transition to CANCELLED', () => {
      expect(canTransitionTripStatus(from, 'cancelled')).toBe(true)
    })

    it('should reject transition to DRAFT', () => {
      expect(canTransitionTripStatus(from, 'draft')).toBe(false)
    })

    it('should reject transition to QUOTED', () => {
      expect(canTransitionTripStatus(from, 'quoted')).toBe(false)
    })

    it('should allow no-op (same status)', () => {
      expect(canTransitionTripStatus(from, 'booked')).toBe(true)
    })
  })

  describe('from IN_PROGRESS', () => {
    const from: TripStatus = 'in_progress'

    it('should allow transition to COMPLETED', () => {
      expect(canTransitionTripStatus(from, 'completed')).toBe(true)
    })

    it('should allow transition to CANCELLED', () => {
      expect(canTransitionTripStatus(from, 'cancelled')).toBe(true)
    })

    it('should reject transition to DRAFT', () => {
      expect(canTransitionTripStatus(from, 'draft')).toBe(false)
    })

    it('should reject transition to QUOTED', () => {
      expect(canTransitionTripStatus(from, 'quoted')).toBe(false)
    })

    it('should reject transition to BOOKED', () => {
      expect(canTransitionTripStatus(from, 'booked')).toBe(false)
    })

    it('should allow no-op (same status)', () => {
      expect(canTransitionTripStatus(from, 'in_progress')).toBe(true)
    })
  })

  describe('from COMPLETED (terminal state)', () => {
    const from: TripStatus = 'completed'

    it('should reject transition to DRAFT', () => {
      expect(canTransitionTripStatus(from, 'draft')).toBe(false)
    })

    it('should reject transition to QUOTED', () => {
      expect(canTransitionTripStatus(from, 'quoted')).toBe(false)
    })

    it('should reject transition to BOOKED', () => {
      expect(canTransitionTripStatus(from, 'booked')).toBe(false)
    })

    it('should reject transition to IN_PROGRESS', () => {
      expect(canTransitionTripStatus(from, 'in_progress')).toBe(false)
    })

    it('should reject transition to CANCELLED', () => {
      expect(canTransitionTripStatus(from, 'cancelled')).toBe(false)
    })

    it('should allow no-op (same status)', () => {
      expect(canTransitionTripStatus(from, 'completed')).toBe(true)
    })
  })

  describe('from CANCELLED (terminal state)', () => {
    const from: TripStatus = 'cancelled'

    it('should reject transition to DRAFT', () => {
      expect(canTransitionTripStatus(from, 'draft')).toBe(false)
    })

    it('should reject transition to QUOTED', () => {
      expect(canTransitionTripStatus(from, 'quoted')).toBe(false)
    })

    it('should reject transition to BOOKED', () => {
      expect(canTransitionTripStatus(from, 'booked')).toBe(false)
    })

    it('should reject transition to IN_PROGRESS', () => {
      expect(canTransitionTripStatus(from, 'in_progress')).toBe(false)
    })

    it('should reject transition to COMPLETED', () => {
      expect(canTransitionTripStatus(from, 'completed')).toBe(false)
    })

    it('should allow no-op (same status)', () => {
      expect(canTransitionTripStatus(from, 'cancelled')).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should always allow no-op transitions for all statuses', () => {
      const statuses: TripStatus[] = [
        'draft',
        'quoted',
        'booked',
        'in_progress',
        'completed',
        'cancelled',
      ]

      statuses.forEach((status) => {
        expect(canTransitionTripStatus(status, status)).toBe(true)
      })
    })
  })
})
