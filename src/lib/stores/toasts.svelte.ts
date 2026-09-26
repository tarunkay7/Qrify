export type Tone = 'neutral' | 'success' | 'warning' | 'error';

export interface Toast {
	id: number;
	message: string;
	tone: Tone;
	action?: { label: string; run: () => void };
}

let nextId = 1;

class Toasts {
	items = $state<Toast[]>([]);
	#timers = new Map<number, ReturnType<typeof setTimeout>>();

	show(message: string, opts: { tone?: Tone; action?: Toast['action']; ms?: number } = {}) {
		const toast: Toast = {
			id: nextId++,
			message,
			tone: opts.tone ?? 'neutral',
			action: opts.action
		};
		// Keep the stack short at a busy door: newest three only.
		this.items = [...this.items.slice(-2), toast];
		this.#timers.set(
			toast.id,
			setTimeout(() => this.dismiss(toast.id), opts.ms ?? (opts.action ? 6000 : 3500))
		);
		return toast.id;
	}

	dismiss(id: number) {
		clearTimeout(this.#timers.get(id));
		this.#timers.delete(id);
		this.items = this.items.filter((t) => t.id !== id);
	}
}

export const toasts = new Toasts();
