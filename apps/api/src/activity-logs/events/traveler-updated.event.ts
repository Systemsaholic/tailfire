/**
 * Domain Event: Traveler Updated
 *
 * Emitted when a traveler is updated on a trip.
 */

export class TravelerUpdatedEvent {
  constructor(
    public readonly travelerId: string,
    public readonly tripId: string,
    public readonly travelerName: string,
    public readonly actorId: string | null,
    public readonly changes?: Record<string, any>,
  ) {}
}
