import type { Attendee, IdProfile } from './types';

export interface Table {
	header: string[];
	rows: string[][];
}

const pad = (n: number) => String(n).padStart(2, '0');

const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Local time as `YYYY-MM-DD HH:mm:ss` — sorts correctly and Excel parses it. */
export const formatTimestamp = (ms: number) => {
	const d = new Date(ms);
	return `${isoDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export function toTable(profile: IdProfile, attendees: Attendee[]): Table {
	const sorted = [...attendees].sort((a, b) => a.scannedAt - b.scannedAt);
	return {
		header: ['#', ...profile.columns.map((c) => c.label), 'Checked in', 'Source'],
		rows: sorted.map((a, i) => [
			String(i + 1),
			...profile.columns.map((c) => (c.key === 'key' ? a.key : (a.fields[c.key] ?? ''))),
			formatTimestamp(a.scannedAt),
			a.source
		])
	};
}

export function exportFilename(eventName: string, ext: string, date: Date = new Date()): string {
	const slug = eventName
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
	return `${slug || 'attendance'}-${isoDate(date)}.${ext}`;
}
