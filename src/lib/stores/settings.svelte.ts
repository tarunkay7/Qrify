import { browser } from '$app/environment';
import { DEFAULT_PROFILE_ID } from '$lib/domain/profiles';

export type Theme = 'system' | 'light' | 'dark';

interface Stored {
	theme: Theme;
	sound: boolean;
	profileId: string;
}

const KEY = 'qrify:settings';
const DEFAULTS: Stored = { theme: 'system', sound: true, profileId: DEFAULT_PROFILE_ID };

function load(): Stored {
	if (!browser) return DEFAULTS;
	try {
		return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
	} catch {
		return DEFAULTS;
	}
}

class Settings {
	#s = $state(load());

	get theme() {
		return this.#s.theme;
	}
	set theme(v: Theme) {
		this.#set({ theme: v });
	}
	get sound() {
		return this.#s.sound;
	}
	set sound(v: boolean) {
		this.#set({ sound: v });
	}
	get profileId() {
		return this.#s.profileId;
	}
	set profileId(v: string) {
		this.#set({ profileId: v });
	}

	#set(patch: Partial<Stored>) {
		this.#s = { ...this.#s, ...patch };
		if (browser) localStorage.setItem(KEY, JSON.stringify(this.#s));
	}
}

export const settings = new Settings();
