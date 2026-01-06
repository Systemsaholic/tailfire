/**
 * Domain Event: Trip Updated
 *
 * Emitted when a trip is updated.
 */

export class TripUpdatedEvent {
  constructor(
    public readonly tripId: string,
    public readonly tripName: string,
    public readonly actorId: string | null,
    public readonly changes?: Record<string, any>,
  ) {}
}
