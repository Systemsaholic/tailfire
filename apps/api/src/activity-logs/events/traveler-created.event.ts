/**
 * Domain Event: Traveler Created
 *
 * Emitted when a traveler is added to a trip.
 */

export class TravelerCreatedEvent {
  constructor(
    public readonly travelerId: string,
    public readonly tripId: string,
    public readonly travelerName: string,
    public readonly actorId: string | null,
    public readonly metadata?: Record<string, any>,
  ) {}
}
