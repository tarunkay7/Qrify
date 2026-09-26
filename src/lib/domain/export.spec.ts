import { describe, expect, it } from 'vitest';
import { exportFilename, toTable } from './export';
import { klh } from './profiles/klh';
import type { Attendee } from './types';

const at = (key: string, scannedAt: number, source: Attendee['source'] = 'scan'): Attendee => ({
	id: key,
	eventId: 'e1',
	key,
	raw: key,
	fields: klh.parse(key),
	source,
	scannedAt
});

describe('toTable', () => {
	const t0 = new Date(2026, 8, 26, 9, 5, 7).getTime();

	it('uses #, profile columns, time and source as the header', () => {
		expect(toTable(klh, []).header).toEqual([
			'#',
			'Roll number',
			'Email',
			'Dept',
			'Year',
			'Checked in',
			'Source'
		]);
	});

	it('orders rows by check-in time and numbers them from 1', () => {
		const rows = toTable(klh, [at('2410040002', t0 + 1000), at('2410030117', t0, 'manual')]).rows;
		expect(rows).toEqual([
			['1', '2410030117', '2410030117@klh.edu.in', 'CSE', 'Y24', '2026-09-26 09:05:07', 'manual'],
			['2', '2410040002', '2410040002@klh.edu.in', 'ECE', 'Y24', '2026-09-26 09:05:08', 'scan']
		]);
	});

	it('leaves missing fields blank', () => {
		const a = { ...at('2410030117', t0), fields: {} };
		expect(toTable(klh, [a]).rows[0].slice(2, 5)).toEqual(['', '', '']);
	});
});

describe('exportFilename', () => {
	it('slugifies the event name and appends the date', () => {
		const d = new Date(2026, 8, 26);
		expect(exportFilename("Freshers '26 — Day 1", 'csv', d)).toBe(
			'freshers-26-day-1-2026-09-26.csv'
		);
	});

	it('falls back to "attendance" for names with no usable characters', () => {
		expect(exportFilename('???', 'xlsx', new Date(2026, 0, 2))).toBe('attendance-2026-01-02.xlsx');
	});
});
