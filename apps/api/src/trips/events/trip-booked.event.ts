/**
 * Domain Event: Trip Booked
 *
 * Emitted when a trip transitions to 'booked' status.
 * Allows decoupled services to react to booking events without direct dependencies.
 *
 * Example: ContactsService listens for this event to set first booking date.
 */

export class TripBookedEvent {
  constructor(
    public readonly tripId: string,
    public readonly primaryContactId: string | null,
    public readonly bookingDate: string,
  ) {}
}
