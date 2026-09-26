export type Cue = 'added' | 'duplicate' | 'invalid';

let ctx: AudioContext | undefined;

const TONES: Record<Cue, { freq: number[]; ms: number }> = {
	added: { freq: [1320], ms: 90 },
	duplicate: { freq: [520, 520], ms: 70 },
	invalid: { freq: [260], ms: 180 }
};

const VIBRATION: Record<Cue, number[]> = {
	added: [40],
	duplicate: [30, 60, 30],
	invalid: [120]
};

/** Short synthesized tone + haptic. Different cues are distinguishable without looking. */
export function cue(kind: Cue, { sound = true } = {}) {
	navigator.vibrate?.(VIBRATION[kind]);
	if (!sound) return;
	try {
		ctx ??= new AudioContext();
		if (ctx.state === 'suspended') void ctx.resume();
		const { freq, ms } = TONES[kind];
		freq.forEach((f, i) => {
			const start = ctx!.currentTime + (i * ms * 1.6) / 1000;
			const osc = ctx!.createOscillator();
			const gain = ctx!.createGain();
			osc.type = 'sine';
			osc.frequency.value = f;
			gain.gain.setValueAtTime(0.0001, start);
			gain.gain.exponentialRampToValueAtTime(0.25, start + 0.01);
			gain.gain.exponentialRampToValueAtTime(0.0001, start + ms / 1000);
			osc.connect(gain).connect(ctx!.destination);
			osc.start(start);
			osc.stop(start + ms / 1000 + 0.02);
		});
	} catch {
		// Audio is a nicety; never block a check-in on it.
	}
}
