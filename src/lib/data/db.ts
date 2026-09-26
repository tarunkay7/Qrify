import Dexie, { type EntityTable } from 'dexie';
import type { Attendee, EventRecord } from '$lib/domain/types';

export class QrifyDB extends Dexie {
	events!: EntityTable<EventRecord, 'id'>;
	attendees!: EntityTable<Attendee, 'id'>;

	constructor(name = 'qrify') {
		super(name);
		this.version(1).stores({
			events: 'id, updatedAt',
			// Compound unique index: one check-in per person per event.
			attendees: 'id, eventId, &[eventId+key], [eventId+scannedAt]'
		});
	}
}
