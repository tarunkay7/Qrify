import type { IdProfile } from '../types';

/** Digits 5–6 of a KLH roll number identify the department. Extend as needed. */
const DEPARTMENTS: Record<string, string> = {
	'03': 'CSE',
	'04': 'ECE',
	'08': 'AI&DS'
};

const EMAIL_DOMAIN = 'klh.edu.in';
const ROLL_LENGTH = 10;

export const klh: IdProfile = {
	id: 'klh',
	name: 'KL University Hyderabad',
	description: 'QR on the back of the KLH ID card. Derives email, department and year.',
	placeholder: 'Roll number, e.g. 2410030117',
	columns: [
		{ key: 'key', label: 'Roll number', mono: true },
		{ key: 'email', label: 'Email' },
		{ key: 'dept', label: 'Dept' },
		{ key: 'year', label: 'Year', mono: true }
	],

	normalize: (raw) => raw.replace(/\s+/g, ''),

	validate(key) {
		if (new RegExp(`^\\d{${ROLL_LENGTH}}$`).test(key)) return { ok: true };
		if (/\D/.test(key)) return { ok: false, reason: 'Roll numbers contain only digits.' };
		return {
			ok: false,
			reason: `Roll numbers are ${ROLL_LENGTH} digits — got ${key.length}.`
		};
	},

	parse(key) {
		const code = key.slice(4, 6);
		return {
			email: `${key}@${EMAIL_DOMAIN}`,
			dept: DEPARTMENTS[code] ?? `Code ${code}`,
			year: `Y${key.slice(0, 2)}`
		};
	}
};
