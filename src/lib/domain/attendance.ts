import type { EntrySource, IdProfile, NewEntry } from './types';

export type PrepareResult = { ok: true; entry: NewEntry } | { ok: false; reason: string };

/** Turns raw scanner/keyboard input into an entry ready to store, or a reason it can't be. */
export function prepareEntry(
	profile: IdProfile,
	raw: string,
	source: EntrySource,
	now: number = Date.now()
): PrepareResult {
	const key = profile.normalize(raw);
	const validation = profile.validate(key);
	if (!validation.ok) return validation;
	return {
		ok: true,
		entry: { key, raw, fields: profile.parse(key), source, scannedAt: now }
	};
}
