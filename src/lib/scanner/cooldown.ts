/**
 * Returns a gate that admits a value only if it hasn't been seen for `ms`.
 * Every sighting refreshes the timer, so a card held in front of the camera
 * is counted once, not once per frame.
 */
export function createCooldown(ms: number) {
	const lastSeen = new Map<string, number>();
	return (value: string, now: number = performance.now()): boolean => {
		const prev = lastSeen.get(value);
		lastSeen.set(value, now);
		return prev === undefined || now - prev >= ms;
	};
}
