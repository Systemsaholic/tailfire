/**
 * Domain Event: Trip Deleted
 *
 * Emitted when a trip is deleted.
 */

export class TripDeletedEvent {
  constructor(
    public readonly tripId: string,
    public readonly tripName: string,
    public readonly actorId: string | null,
  ) {}
}
