<script lang="ts">
	import { repo } from '$lib/data';
	import { listProfiles } from '$lib/domain/profiles';
	import { settings, type Theme } from '$lib/stores/settings.svelte';
	import { toasts } from '$lib/stores/toasts.svelte';
	import ConfirmDialog from '$lib/ui/ConfirmDialog.svelte';

	const profiles = listProfiles();
	const themes: { value: Theme; label: string }[] = [
		{ value: 'system', label: 'Match device' },
		{ value: 'light', label: 'Light' },
		{ value: 'dark', label: 'Dark' }
	];

	let confirmClear = $state(false);

	async function clearAll() {
		await repo.clearAll();
		toasts.show('Deleted all events.');
	}
</script>

<svelte:head>
	<title>Settings — Qrify</title>
</svelte:head>

<h1>Settings</h1>

<section aria-labelledby="format">
	<h2 id="format">ID card format</h2>
	<p class="note">Used for new events. Existing events keep the format they started with.</p>
	<fieldset>
		<legend class="visually-hidden">ID card format</legend>
		{#each profiles as p (p.id)}
			<label class="choice">
				<input type="radio" name="profile" value={p.id} bind:group={settings.profileId} />
				<span>
					<strong>{p.name}</strong>
					<small>{p.description}</small>
				</span>
			</label>
		{/each}
	</fieldset>
</section>

<section aria-labelledby="feedback">
	<h2 id="feedback">Check-in feedback</h2>
	<label class="choice">
		<input type="checkbox" bind:checked={settings.sound} />
		<span>
			<strong>Play a sound</strong>
			<small>A high beep for a new check-in, a double low beep for someone already in.</small>
		</span>
	</label>
</section>

<section aria-labelledby="appearance">
	<h2 id="appearance">Appearance</h2>
	<fieldset class="inline">
		<legend class="visually-hidden">Theme</legend>
		{#each themes as t (t.value)}
			<label class="pill">
				<input type="radio" name="theme" value={t.value} bind:group={settings.theme} />
				<span>{t.label}</span>
			</label>
		{/each}
	</fieldset>
</section>

<section aria-labelledby="data">
	<h2 id="data">Your data</h2>
	<p class="note">
		Everything stays in this browser on this device. Nothing is uploaded, and Qrify works without a
		connection once it has loaded.
	</p>
	<button class="btn btn-danger" onclick={() => (confirmClear = true)}>Delete all events</button>
</section>

<footer>
	<p>
		Qrify 2.0, made by Tarun K Menon.
		<a href="https://github.com/tarunkay7/Qrify">Source on GitHub</a>.
	</p>
</footer>

<ConfirmDialog
	bind:open={confirmClear}
	title="Delete all events?"
	confirmLabel="Delete everything"
	cancelLabel="Keep them"
	onconfirm={clearAll}
>
	<p>Every event and check-in on this device will be removed. This can’t be undone.</p>
</ConfirmDialog>

<style>
	h1 {
		font-size: var(--t-xl);
		padding: clamp(1rem, 4vw, 2.5rem) 0 1.25rem;
		border-bottom: 1px solid var(--ink);
	}

	section {
		max-width: 40rem;
		padding: 1.75rem 0;
		border-bottom: 1px solid var(--rule);
	}

	h2 {
		font-size: var(--t-md);
		margin-bottom: 0.5rem;
	}

	.note {
		color: var(--pencil);
		margin-bottom: 1rem;
	}

	fieldset {
		border: 0;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.25rem;
	}

	.choice {
		display: flex;
		gap: 0.85rem;
		align-items: flex-start;
		padding: 0.6rem 0;
		cursor: pointer;
	}

	.choice input {
		margin-top: 0.3rem;
		accent-color: var(--margin);
		width: 1.1rem;
		height: 1.1rem;
	}

	.choice strong {
		display: block;
		font-weight: 500;
	}

	.choice small {
		display: block;
		font-size: var(--t-sm);
		color: var(--pencil);
	}

	.inline {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.pill input {
		position: absolute;
		opacity: 0;
	}

	.pill span {
		display: inline-block;
		padding: 0.55rem 1rem;
		border: 1px solid var(--rule);
		border-radius: 999px;
		cursor: pointer;
		font-size: var(--t-sm);
	}

	.pill input:checked + span {
		border-color: var(--ink);
		background: var(--ink);
		color: var(--paper);
	}

	.pill input:focus-visible + span {
		outline: 2px solid var(--margin);
		outline-offset: 2px;
	}

	footer {
		padding-top: 2rem;
		font-size: var(--t-sm);
		color: var(--pencil);
	}
</style>
