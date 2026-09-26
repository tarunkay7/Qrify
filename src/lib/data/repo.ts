import { Dexie } from 'dexie';
import type { Attendee, EventRecord, NewEntry } from '$lib/domain/types';
import { QrifyDB } from './db';

export type EventSummary = EventRecord & { count: number };

export type AddResult =
	{ status: 'added'; attendee: Attendee } | { status: 'duplicate'; attendee: Attendee };

export function createRepo(db: QrifyDB) {
	return {
		async createEvent(name: string, profileId: string): Promise<EventRecord> {
			const trimmed = name.trim();
			if (!trimmed) throw new Error('Give the event a name.');
			const now = Date.now();
			const event = {
				id: crypto.randomUUID(),
				name: trimmed,
				profileId,
				createdAt: now,
				updatedAt: now
			};
			await db.events.add(event);
			return event;
		},

		getEvent: (id: string) => db.events.get(id),

		async listEvents(): Promise<EventSummary[]> {
			const events = await db.events.toArray();
			const counts = await Promise.all(
				events.map((e) => db.attendees.where('eventId').equals(e.id).count())
			);
			return events
				.map((e, i) => ({ ...e, count: counts[i] }))
				.sort((a, b) => b.updatedAt - a.updatedAt || b.createdAt - a.createdAt);
		},

		deleteEvent: (id: string) =>
			db.transaction('rw', db.events, db.attendees, async () => {
				await db.attendees.where('eventId').equals(id).delete();
				await db.events.delete(id);
			}),

		addAttendee: (eventId: string, entry: NewEntry): Promise<AddResult> =>
			db.transaction('rw', db.events, db.attendees, async () => {
				const existing = await db.attendees.where({ eventId, key: entry.key }).first();
				if (existing) return { status: 'duplicate', attendee: existing } as const;
				const attendee: Attendee = { ...entry, id: crypto.randomUUID(), eventId };
				await db.attendees.add(attendee);
				await db.events.update(eventId, { updatedAt: entry.scannedAt });
				return { status: 'added', attendee } as const;
			}),

		listAttendees: (eventId: string) =>
			db.attendees
				.where('[eventId+scannedAt]')
				.between([eventId, Dexie.minKey], [eventId, Dexie.maxKey])
				.reverse()
				.toArray(),

		async removeAttendee(id: string): Promise<Attendee | undefined> {
			const attendee = await db.attendees.get(id);
			if (attendee) await db.attendees.delete(id);
			return attendee;
		},

		restoreAttendee: (attendee: Attendee) => db.attendees.put(attendee),

		clearAll: () =>
			db.transaction('rw', db.events, db.attendees, async () => {
				await db.attendees.clear();
				await db.events.clear();
			})
	};
}

export type Repo = ReturnType<typeof createRepo>;
