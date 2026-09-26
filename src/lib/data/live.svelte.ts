import { liveQuery } from 'dexie';

/**
 * Subscribes to a Dexie query and re-runs it whenever the underlying tables
 * change. `deps` is read reactively; the query re-subscribes when it changes.
 */
export function live<D, T>(deps: () => D, query: (deps: D) => Promise<T>) {
	let current = $state<T | undefined>();
	let loaded = $state(false);

	$effect(() => {
		const d = deps();
		loaded = false;
		const sub = liveQuery(() => query(d)).subscribe({
			next: (value) => {
				current = value;
				loaded = true;
			},
			error: (err) => {
				console.error(err);
				loaded = true;
			}
		});
		return () => sub.unsubscribe();
	});

	return {
		get current() {
			return current;
		},
		get loaded() {
			return loaded;
		}
	};
}
