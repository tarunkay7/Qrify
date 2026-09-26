import { describe, expect, it } from 'vitest';
import { prepareEntry } from './attendance';
import { klh } from './profiles/klh';

const NOW = Date.UTC(2026, 8, 26, 10, 42);

describe('prepareEntry', () => {
	it('builds an entry with normalized key and parsed fields', () => {
		expect(prepareEntry(klh, ' 2410030117 ', 'scan', NOW)).toEqual({
			ok: true,
			entry: {
				key: '2410030117',
				raw: ' 2410030117 ',
				fields: { email: '2410030117@klh.edu.in', dept: 'CSE', year: 'Y24' },
				source: 'scan',
				scannedAt: NOW
			}
		});
	});

	it('returns the validation reason for invalid input', () => {
		expect(prepareEntry(klh, '12', 'manual', NOW)).toEqual({
			ok: false,
			reason: 'Roll numbers are 10 digits — got 2.'
		});
	});
});
