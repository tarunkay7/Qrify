import type { Table } from '$lib/domain/export';
import { toCsv } from './csv';

function save(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const a = Object.assign(document.createElement('a'), { href: url, download: filename });
	document.body.append(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadCsv(table: Table, filename: string) {
	save(new Blob([toCsv(table)], { type: 'text/csv;charset=utf-8' }), filename);
}

/** The xlsx writer is loaded only when someone actually exports. */
export async function downloadXlsx(table: Table, filename: string, sheet: string) {
	const { default: writeExcelFile } = await import('write-excel-file/browser');
	const header = table.header.map((value) => ({ value, fontWeight: 'bold' as const }));
	const blob = await writeExcelFile([header, ...table.rows], {
		// Excel sheet names: max 31 chars, no []:*?/\
		sheet:
			sheet
				.replace(/[[\]:*?/\\]/g, ' ')
				.slice(0, 31)
				.trim() || 'Attendance',
		stickyRowsCount: 1,
		columns: table.header.map((h) => ({ width: h === '#' ? 6 : h === 'Email' ? 28 : 16 }))
	}).toBlob();
	save(blob, filename);
}
