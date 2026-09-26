import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { QrifyDB } from './db';
import { createRepo, type Repo } from './repo';
import type { NewEntry } from '$lib/domain/types';

const entry = (key: string, scannedAt = 1): NewEntry => ({
	key,
	raw: key,
	fields: {},
	source: 'scan',
	scannedAt
});

let repo: Repo;
let n = 0;

beforeEach(() => {
	repo = createRepo(new QrifyDB(`test-${n++}`));
});

describe('events', () => {
	it('creates an event with a trimmed name and returns it', async () => {
		const e = await repo.createEvent('  Freshers  ', 'klh');
		expect(e).toMatchObject({ name: 'Freshers', profileId: 'klh' });
		expect(await repo.getEvent(e.id)).toEqual(e);
	});

	it('rejects blank names', async () => {
		await expect(repo.createEvent('   ', 'klh')).rejects.toThrow('Give the event a name.');
	});

	it('lists events most recently active first, with attendee counts', async () => {
		const a = await repo.createEvent('A', 'klh');
		const b = await repo.createEvent('B', 'klh');
		await repo.addAttendee(a.id, entry('x', Date.now() + 10_000));
		const list = await repo.listEvents();
		expect(list.map((e) => [e.name, e.count])).toEqual([
			['A', 1],
			['B', 0]
		]);
		expect(b.id).toBeTruthy();
	});

	it('deletes an event together with its attendees', async () => {
		const e = await repo.createEvent('A', 'klh');
		await repo.addAttendee(e.id, entry('x'));
		await repo.deleteEvent(e.id);
		expect(await repo.getEvent(e.id)).toBeUndefined();
		expect(await repo.listAttendees(e.id)).toEqual([]);
	});
});

describe('attendees', () => {
	it('adds an attendee', async () => {
		const e = await repo.createEvent('A', 'klh');
		const result = await repo.addAttendee(e.id, entry('x'));
		expect(result.status).toBe('added');
		expect(await repo.listAttendees(e.id)).toHaveLength(1);
	});

	it('reports duplicates with the original check-in and does not add them', async () => {
		const e = await repo.createEvent('A', 'klh');
		await repo.addAttendee(e.id, entry('x', 100));
		const result = await repo.addAttendee(e.id, entry('x', 200));
		expect(result).toMatchObject({ status: 'duplicate', attendee: { scannedAt: 100 } });
		expect(await repo.listAttendees(e.id)).toHaveLength(1);
	});

	it('allows the same person at different events', async () => {
		const a = await repo.createEvent('A', 'klh');
		const b = await repo.createEvent('B', 'klh');
		await repo.addAttendee(a.id, entry('x'));
		expect((await repo.addAttendee(b.id, entry('x'))).status).toBe('added');
	});

	it('lists newest check-ins first', async () => {
		const e = await repo.createEvent('A', 'klh');
		await repo.addAttendee(e.id, entry('old', 1));
		await repo.addAttendee(e.id, entry('new', 2));
		expect((await repo.listAttendees(e.id)).map((a) => a.key)).toEqual(['new', 'old']);
	});

	it('removes an attendee and can restore it exactly', async () => {
		const e = await repo.createEvent('A', 'klh');
		const { attendee } = await repo.addAttendee(e.id, entry('x'));
		const removed = await repo.removeAttendee(attendee.id);
		expect(await repo.listAttendees(e.id)).toEqual([]);
		await repo.restoreAttendee(removed!);
		expect(await repo.listAttendees(e.id)).toEqual([attendee]);
	});
});

describe('clearAll', () => {
	it('removes every event and attendee', async () => {
		const e = await repo.createEvent('A', 'klh');
		await repo.addAttendee(e.id, entry('x'));
		await repo.clearAll();
		expect(await repo.listEvents()).toEqual([]);
	});
});
