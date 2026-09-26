export type Fields = Record<string, string>;

export interface Column {
	key: string;
	label: string;
	/** Render in monospace with tabular figures (ids, codes). */
	mono?: boolean;
}

export type Validation = { ok: true } | { ok: false; reason: string };

/**
 * Describes how to turn the raw text of a scanned ID into a stable key
 * and a set of display/export fields. One profile per ID card format.
 */
export interface IdProfile {
	id: string;
	name: string;
	description: string;
	/** Hint shown in the manual-entry input. */
	placeholder: string;
	/** Columns shown in the table and export, in order. `key` is always first. */
	columns: Column[];
	normalize(raw: string): string;
	validate(key: string): Validation;
	parse(key: string): Fields;
}

export type EntrySource = 'scan' | 'manual';

export interface EventRecord {
	id: string;
	name: string;
	profileId: string;
	createdAt: number;
	updatedAt: number;
}

export interface Attendee {
	id: string;
	eventId: string;
	/** Normalized identifier; unique per event. */
	key: string;
	raw: string;
	fields: Fields;
	source: EntrySource;
	scannedAt: number;
}

export type NewEntry = Omit<Attendee, 'id' | 'eventId'>;
