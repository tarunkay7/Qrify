import { describe, expect, it } from 'vitest';
import { createCooldown } from './cooldown';

describe('createCooldown', () => {
	it('lets the first sighting of a value through', () => {
		const allow = createCooldown(2500);
		expect(allow('a', 0)).toBe(true);
	});

	it('suppresses the same value while it stays in view', () => {
		const allow = createCooldown(2500);
		allow('a', 0);
		expect(allow('a', 1000)).toBe(false);
		expect(allow('a', 3000)).toBe(false);
	});

	it('lets the same value through once it has been out of view for the cooldown', () => {
		const allow = createCooldown(2500);
		allow('a', 0);
		expect(allow('a', 2600)).toBe(true);
	});

	it('tracks values independently', () => {
		const allow = createCooldown(2500);
		allow('a', 0);
		expect(allow('b', 100)).toBe(true);
	});
});
