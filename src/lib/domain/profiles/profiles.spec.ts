import { describe, expect, it } from 'vitest';
import { klh } from './klh';
import { generic } from './generic';
import { getProfile, listProfiles, DEFAULT_PROFILE_ID } from './index';

describe('klh profile', () => {
	it('normalizes by trimming and removing inner whitespace', () => {
		expect(klh.normalize('  2110 080023 \n')).toBe('2110080023');
	});

	it('accepts a 10-digit roll number', () => {
		expect(klh.validate('2110080023')).toEqual({ ok: true });
	});

	it.each(['211008002', '21100800234', '21100800AB', ''])('rejects %j', (key) => {
		const result = klh.validate(key);
		expect(result.ok).toBe(false);
	});

	it('explains why a roll number is rejected', () => {
		expect(klh.validate('123')).toEqual({
			ok: false,
			reason: 'Roll numbers are 10 digits — got 3.'
		});
	});

	it('derives email, department and year from the roll number', () => {
		expect(klh.parse('2110080023')).toEqual({
			email: '2110080023@klh.edu.in',
			dept: 'AI&DS',
			year: 'Y21'
		});
	});

	it.each([
		['2410030117', 'CSE'],
		['2410040002', 'ECE'],
		['2410080002', 'AI&DS']
	])('maps department code in %s to %s', (roll, dept) => {
		expect(klh.parse(roll).dept).toBe(dept);
	});

	it('shows the raw code for unknown departments instead of "undefined"', () => {
		expect(klh.parse('2410990001').dept).toBe('Code 99');
	});

	it('lists the key column first', () => {
		expect(klh.columns[0].key).toBe('key');
	});
});

describe('generic profile', () => {
	it('keeps the raw text, trimmed', () => {
		expect(generic.normalize('  hello world ')).toBe('hello world');
	});

	it('rejects empty content', () => {
		expect(generic.validate('').ok).toBe(false);
	});

	it('accepts any non-empty content', () => {
		expect(generic.validate('anything')).toEqual({ ok: true });
	});

	it('has no derived fields', () => {
		expect(generic.parse('x')).toEqual({});
	});
});

describe('profile registry', () => {
	it('defaults to the KLH profile', () => {
		expect(DEFAULT_PROFILE_ID).toBe('klh');
	});

	it('looks up profiles by id', () => {
		expect(getProfile('generic')).toBe(generic);
	});

	it('falls back to the generic profile for unknown ids', () => {
		expect(getProfile('nope')).toBe(generic);
	});

	it('lists all profiles', () => {
		expect(listProfiles().map((p) => p.id)).toEqual(['klh', 'generic']);
	});
});
