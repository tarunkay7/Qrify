import type { Table } from '$lib/domain/export';

const FORMULA_PREFIX = /^[=+\-@\t\r]/;

function cell(value: string): string {
	const safe = FORMULA_PREFIX.test(value) ? `'${value}` : value;
	return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** RFC 4180 CSV with a BOM, so Excel opens it as UTF-8. */
export function toCsv({ header, rows }: Table): string {
	return '﻿' + [header, ...rows].map((r) => r.map(cell).join(',') + '\r\n').join('');
}
