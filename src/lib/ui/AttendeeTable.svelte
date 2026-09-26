<script lang="ts">
	import type { Attendee, IdProfile } from '$lib/domain/types';
	import { formatTime } from '$lib/format';

	let {
		attendees,
		profile,
		highlightId,
		onremove
	}: {
		/** Newest first. */
		attendees: Attendee[];
		profile: IdProfile;
		highlightId?: string;
		onremove: (a: Attendee) => void;
	} = $props();

	const value = (a: Attendee, key: string) => (key === 'key' ? a.key : (a.fields[key] ?? ''));
</script>

<div class="wrap">
	<table>
		<caption class="visually-hidden">Checked-in attendees, newest first</caption>
		<thead>
			<tr>
				<th class="n" scope="col">#</th>
				{#each profile.columns as c (c.key)}
					<th scope="col" class:wide={c.key === 'email'}>{c.label}</th>
				{/each}
				<th scope="col">Time</th>
				<th scope="col"><span class="visually-hidden">Remove</span></th>
			</tr>
		</thead>
		<tbody>
			{#each attendees as a, i (a.id)}
				<tr class:fresh={a.id === highlightId}>
					<td class="n">{attendees.length - i}</td>
					{#each profile.columns as c (c.key)}
						<td class:key={c.key === 'key'} class:wide={c.key === 'email'}>{value(a, c.key)}</td>
					{/each}
					<td class="time">
						{formatTime(a.scannedAt)}{#if a.source === 'manual'}<span class="typed" title="Typed in"
								>typed</span
							>{/if}
					</td>
					<td class="x">
						<button aria-label="Remove {a.key}" onclick={() => onremove(a)}>
							<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"
								><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.5" /></svg
							>
						</button>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.wrap {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--t-sm);
	}

	th,
	td {
		height: var(--row);
		padding: 0 0.75rem;
		text-align: left;
		white-space: nowrap;
		border-bottom: 1px solid var(--rule);
	}

	th {
		font-weight: 500;
		color: var(--pencil);
		border-bottom-color: var(--ink);
	}

	/* The register's red margin line. */
	.n {
		width: 3.25rem;
		padding-left: 0;
		text-align: right;
		color: var(--pencil);
		border-right: 1.5px solid var(--margin);
	}

	.key {
		font-size: var(--t-base);
		font-weight: 500;
		letter-spacing: 0.02em;
	}

	.time {
		color: var(--pencil);
	}

	.typed {
		margin-left: 0.5rem;
		font-size: 0.75rem;
		font-style: italic;
		font-family: var(--serif);
	}

	.x {
		width: 2.75rem;
		padding: 0;
		text-align: right;
	}

	.x button {
		display: inline-grid;
		place-items: center;
		width: 2.5rem;
		height: 2.5rem;
		color: var(--pencil);
		background: none;
		border: 0;
		border-radius: var(--radius);
		cursor: pointer;
	}

	.x button:hover {
		color: var(--margin);
		background: var(--paper-sunk);
	}

	.fresh td {
		animation: ink 1.6s var(--ease);
	}

	@keyframes ink {
		from {
			background: color-mix(in srgb, var(--margin) 16%, transparent);
		}
	}

	@media (max-width: 719px) {
		.wide {
			display: none;
		}

		th,
		td {
			padding-inline: 0.45rem;
		}

		.n {
			width: 2.5rem;
			padding-left: 0;
		}

		/* Mark typed entries with a small dot instead of the word on narrow screens. */
		.typed {
			font-size: 0;
			margin-left: 0.35rem;
		}

		.typed::before {
			content: '';
			display: inline-block;
			width: 0.35rem;
			height: 0.35rem;
			border-radius: 50%;
			background: var(--pencil);
			vertical-align: middle;
		}
	}
</style>
