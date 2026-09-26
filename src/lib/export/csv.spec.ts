import { describe, expect, it } from 'vitest';
import { toCsv } from './csv';

describe('toCsv', () => {
	it('starts with a UTF-8 BOM so Excel detects the encoding', () => {
		expect(toCsv({ header: ['a'], rows: [] }).startsWith('﻿')).toBe(true);
	});

	it('joins cells with commas and lines with CRLF', () => {
		expect(toCsv({ header: ['a', 'b'], rows: [['1', '2']] })).toBe('﻿a,b\r\n1,2\r\n');
	});

	it('quotes cells containing commas, quotes or newlines', () => {
		const csv = toCsv({ header: ['x'], rows: [['AI&DS, "core"'], ['two\nlines']] });
		expect(csv).toBe('﻿x\r\n"AI&DS, ""core"""\r\n"two\nlines"\r\n');
	});

	it('neutralizes spreadsheet formula injection', () => {
		expect(toCsv({ header: ['x'], rows: [['=HYPERLINK("evil")']] })).toBe(
			'﻿x\r\n"\'=HYPERLINK(""evil"")"\r\n'
		);
	});
});
