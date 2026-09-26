<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { repo } from '$lib/data';
	import { live } from '$lib/data/live.svelte';
	import { getProfile, listProfiles } from '$lib/domain/profiles';
	import { formatDay } from '$lib/format';
	import { settings } from '$lib/stores/settings.svelte';
	import { toasts } from '$lib/stores/toasts.svelte';

	const events = live(
		() => null,
		() => repo.listEvents()
	);

	let name = $state('');
	let busy = $state(false);
	const profiles = listProfiles();

	async function start(e: SubmitEvent) {
		e.preventDefault();
		busy = true;
		try {
			const event = await repo.createEvent(name, settings.profileId);
			await goto(resolve('/events/[id]', { id: event.id }));
		} catch (err) {
			toasts.show(err instanceof Error ? err.message : 'Could not create the event.', {
				tone: 'error'
			});
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head>
	<title>Qrify — attendance by ID card</title>
</svelte:head>

<section class="intro">
	<h1>Take attendance by scanning ID cards.</h1>
	<p>
		Point your phone at the QR code on the back of each card. Names are saved on this device as you
		go, and the list downloads as a spreadsheet.
	</p>
</section>

<form class="start" onsubmit={start}>
	<label class="field-label" for="event-name">Event name</label>
	<div class="row">
		<input
			id="event-name"
			class="input"
			bind:value={name}
			placeholder="Freshers’ welcome"
			autocomplete="off"
			maxlength="80"
			required
		/>
		<button class="btn btn-primary" type="submit" disabled={busy || !name.trim()}>
			Start taking attendance
		</button>
	</div>
	<p class="profile">
		<label for="profile">Reading</label>
		<select id="profile" bind:value={settings.profileId}>
			{#each profiles as p (p.id)}
				<option value={p.id}>{p.name}</option>
			{/each}
		</select>
		<span>ID cards</span>
	</p>
</form>

<section class="events" aria-labelledby="events-title">
	<h2 id="events-title">Your events</h2>

	{#if events.loaded && events.current?.length === 0}
		<ol class="steps">
			<li><strong>Name the event.</strong> Each event keeps its own list.</li>
			<li>
				<strong>Scan each ID card.</strong> A beep confirms the check-in; repeats are caught.
			</li>
			<li><strong>Download the list</strong> as Excel or CSV when you’re done.</li>
		</ol>
	{:else if events.current}
		<ul class="ledger">
			{#each events.current as e (e.id)}
				<li>
					<a href={resolve('/events/[id]', { id: e.id })}>
						<span class="name">{e.name}</span>
						<span class="meta">{formatDay(e.createdAt)}, {getProfile(e.profileId).name}</span>
						<span class="count"><b>{e.count}</b> present</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.intro {
		padding-block: clamp(2.5rem, 9vw, 6.5rem) 2rem;
	}

	h1 {
		font-size: var(--t-2xl);
		max-width: 14ch;
		font-variation-settings: 'opsz' 72;
	}

	.intro p {
		margin-top: 1.25rem;
		font-size: var(--t-md);
		line-height: 1.55;
		color: var(--pencil);
		max-width: 34rem;
	}

	.start {
		max-width: 44rem;
		padding-bottom: 3.5rem;
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.row .input {
		flex: 1 1 16rem;
		font-size: var(--t-md);
	}

	.row .btn {
		flex: 0 1 auto;
	}

	.profile {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.35rem;
		margin-top: 0.9rem;
		font-size: var(--t-sm);
		color: var(--pencil);
	}

	select {
		font: inherit;
		color: var(--ink);
		background: transparent;
		border: 0;
		border-bottom: 1px dashed var(--pencil);
		padding: 0.15rem 0.1rem;
		cursor: pointer;
	}

	.events h2 {
		font-size: var(--t-lg);
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--ink);
	}

	.ledger {
		list-style: none;
		padding: 0;
	}

	.ledger a {
		display: grid;
		grid-template-columns: 1fr auto;
		grid-template-areas: 'name count' 'meta count';
		column-gap: 1rem;
		align-items: baseline;
		padding: 0.9rem 0;
		border-bottom: 1px solid var(--rule);
		text-decoration: none;
	}

	.ledger a:hover .name {
		text-decoration: underline;
		text-decoration-color: var(--margin);
	}

	.name {
		grid-area: name;
		font: 500 var(--t-md) / 1.25 var(--serif);
	}

	.meta {
		grid-area: meta;
		font-size: var(--t-sm);
		color: var(--pencil);
	}

	.count {
		grid-area: count;
		align-self: center;
		font-size: var(--t-sm);
		color: var(--pencil);
	}

	.count b {
		font: 500 var(--t-lg) / 1 var(--serif);
		color: var(--ink);
		margin-right: 0.2rem;
	}

	.steps {
		counter-reset: step;
		list-style: none;
		padding: 0;
		display: grid;
		gap: 0;
	}

	.steps li {
		counter-increment: step;
		display: grid;
		grid-template-columns: 2.5rem 1fr;
		padding: 0.9rem 0;
		border-bottom: 1px solid var(--rule);
		color: var(--pencil);
	}

	.steps li::before {
		content: counter(step);
		font: 500 var(--t-md) / 1.2 var(--serif);
		color: var(--margin);
	}

	.steps strong {
		font-weight: 500;
		color: var(--ink);
	}

	@media (min-width: 900px) {
		.steps {
			grid-template-columns: repeat(3, 1fr);
			column-gap: 2rem;
		}
	}
</style>
