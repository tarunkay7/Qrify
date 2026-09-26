import type { IdProfile } from '../types';

export const generic: IdProfile = {
	id: 'generic',
	name: 'Any QR code',
	description: 'Records the QR contents as-is. Works with any ticket or ID.',
	placeholder: 'Code or name',
	columns: [{ key: 'key', label: 'Value', mono: true }],

	normalize: (raw) => raw.trim(),

	validate: (key) => (key ? { ok: true } : { ok: false, reason: 'Nothing to record.' }),

	parse: () => ({})
};
