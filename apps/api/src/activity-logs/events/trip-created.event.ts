/**
 * Domain Event: Trip Created
 *
 * Emitted when a new trip is created.
 */

export class TripCreatedEvent {
  constructor(
    public readonly tripId: string,
    public readonly tripName: string,
    public readonly actorId: string | null,
    public readonly metadata?: Record<string, any>,
  ) {}
}
