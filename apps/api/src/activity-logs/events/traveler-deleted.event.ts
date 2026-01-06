/**
 * Domain Event: Traveler Deleted
 *
 * Emitted when a traveler is removed from a trip.
 */

export class TravelerDeletedEvent {
  constructor(
    public readonly travelerId: string,
    public readonly tripId: string,
    public readonly travelerName: string,
    public readonly actorId: string | null,
  ) {}
}
