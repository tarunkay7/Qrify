<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { repo } from '$lib/data';
	import { live } from '$lib/data/live.svelte';
	import { prepareEntry } from '$lib/domain/attendance';
	import { exportFilename, toTable } from '$lib/domain/export';
	import { getProfile } from '$lib/domain/profiles';
	import type { Attendee, EntrySource } from '$lib/domain/types';
	import { downloadCsv, downloadXlsx } from '$lib/export/download';
	import { formatTime, plural } from '$lib/format';
	import { cue } from '$lib/scanner/feedback';
	import { settings } from '$lib/stores/settings.svelte';
	import { toasts } from '$lib/stores/toasts.svelte';
	import AttendeeTable from '$lib/ui/AttendeeTable.svelte';
	import ConfirmDialog from '$lib/ui/ConfirmDialog.svelte';
	import ScannerView from '$lib/ui/ScannerView.svelte';

	const id = $derived(page.params.id ?? '');
	const event = live(
		() => id,
		(id) => repo.getEvent(id)
	);
	const attendees = live(
		() => id,
		(id) => repo.listAttendees(id)
	);

	const profile = $derived(getProfile(event.current?.profileId ?? ''));
	const list = $derived(attendees.current ?? []);

	let manual = $state('');
	let flash = $state(0);
	let highlightId = $state<string>();
	let announcement = $state('');
	let confirmDelete = $state(false);
	let exporting = $state(false);

	async function record(raw: string, source: EntrySource): Promise<boolean> {
		const prepared = prepareEntry(profile, raw, source);
		if (!prepared.ok) {
			cue('invalid', settings);
			toasts.show(prepared.reason, { tone: 'error' });
			return false;
		}
		const result = await repo.addAttendee(id, prepared.entry);
		const key = result.attendee.key;
		if (result.status === 'duplicate') {
			cue('duplicate', settings);
			toasts.show(`${key} already checked in at ${formatTime(result.attendee.scannedAt)}.`, {
				tone: 'warning'
			});
			return true;
		}
		cue('added', settings);
		flash++;
		highlightId = result.attendee.id;
		announcement = `${key} checked in. ${list.length + 1} present.`;
		return true;
	}

	async function submitManual(e: SubmitEvent) {
		e.preventDefault();
		if (await record(manual, 'manual')) manual = '';
	}

	async function remove(a: Attendee) {
		const removed = await repo.removeAttendee(a.id);
		if (!removed) return;
		toasts.show(`Removed ${a.key}.`, {
			action: { label: 'Undo', run: () => void repo.restoreAttendee(removed) }
		});
	}

	async function download(kind: 'xlsx' | 'csv') {
		if (!event.current) return;
		const table = toTable(profile, list);
		const filename = exportFilename(event.current.name, kind);
		exporting = true;
		try {
			if (kind === 'csv') downloadCsv(table, filename);
			else await downloadXlsx(table, filename, event.current.name);
		} catch (err) {
			console.error(err);
			toasts.show('The spreadsheet couldn’t be created. Try the CSV download instead.', {
				tone: 'error'
			});
		} finally {
			exporting = false;
		}
	}

	async function deleteEvent() {
		const name = event.current?.name;
		await repo.deleteEvent(id);
		await goto(resolve('/'));
		toasts.show(`Deleted ${name}.`);
	}
</script>

<svelte:head>
	<title>{event.current ? `${event.current.name} — Qrify` : 'Qrify'}</title>
</svelte:head>

{#if event.loaded && !event.current}
	<section class="missing">
		<h1>This event isn’t on this device.</h1>
		<p>
			Events are stored in the browser where they were created. If you cleared your browsing data,
			the list is gone.
		</p>
		<a class="btn" href={resolve('/')}>See your events</a>
	</section>
{:else if event.current}
	<header class="head">
		<h1>{event.current.name}</h1>
		<p class="count" aria-label={plural(list.length, 'person', 'people') + ' present'}>
			{#key list.length}<span class="num">{list.length}</span>{/key}
			<span class="label">present</span>
		</p>
	</header>

	<div class="session">
		<section class="capture" aria-label="Check in">
			<ScannerView oncode={(v) => void record(v, 'scan')} {flash} />

			<form class="manual" onsubmit={submitManual}>
				<label class="field-label" for="manual">Or type it in</label>
				<div class="row">
					<input
						id="manual"
						class="input"
						bind:value={manual}
						placeholder={profile.placeholder}
						inputmode={profile.id === 'klh' ? 'numeric' : 'text'}
						autocomplete="off"
						enterkeyhint="done"
					/>
					<button class="btn" type="submit" disabled={!manual.trim()}>Check in</button>
				</div>
			</form>
		</section>

		<section class="register" aria-labelledby="register-title">
			<div class="toolbar">
				<h2 id="register-title">Register</h2>
				<div class="exports">
					<button
						class="btn btn-primary"
						disabled={!list.length || exporting}
						onclick={() => download('xlsx')}>Download Excel</button
					>
					<button class="btn" disabled={!list.length} onclick={() => download('csv')}>CSV</button>
				</div>
			</div>

			{#if list.length}
				<AttendeeTable attendees={list} {profile} {highlightId} onremove={remove} />
			{:else if attendees.loaded}
				<p class="empty">No one yet. Scan the first card and they’ll appear here.</p>
			{/if}

			<button class="btn btn-quiet delete" onclick={() => (confirmDelete = true)}>
				Delete this event
			</button>
		</section>
	</div>

	<p class="visually-hidden" aria-live="assertive">{announcement}</p>

	<ConfirmDialog
		bind:open={confirmDelete}
		title="Delete {event.current.name}?"
		confirmLabel="Delete event"
		cancelLabel="Keep event"
		onconfirm={deleteEvent}
	>
		<p>
			This removes {plural(list.length, 'check-in')} from this device. Download the list first if you
			need it.
		</p>
	</ConfirmDialog>
{/if}

<style>
	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: space-between;
		gap: 0.5rem 2rem;
		padding: clamp(1rem, 4vw, 2.5rem) 0 1.25rem;
		border-bottom: 1px solid var(--ink);
		margin-bottom: 1.5rem;
	}

	h1 {
		font-size: var(--t-xl);
		max-width: 20ch;
	}

	.count {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		margin: 0;
	}

	.num {
		display: inline-block;
		font: 400 clamp(3rem, 9vw, 6rem) / 0.9 var(--serif);
		font-variation-settings: 'opsz' 72;
		letter-spacing: -0.03em;
		color: var(--ink);
		animation: tick 360ms var(--ease);
	}

	@keyframes tick {
		from {
			transform: translateY(0.12em);
			opacity: 0.35;
			color: var(--margin);
		}
	}

	.label {
		font: italic 400 var(--t-md) / 1 var(--serif);
		color: var(--pencil);
	}

	.session {
		display: grid;
		gap: 2rem;
	}

	.capture {
		display: grid;
		gap: 0.5rem;
		align-content: start;
	}

	.row {
		display: flex;
		gap: 0.5rem;
	}

	.row .input {
		flex: 1;
		font-size: var(--t-md);
		letter-spacing: 0.02em;
	}

	.toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}

	.toolbar h2 {
		font-size: var(--t-lg);
	}

	.exports {
		display: flex;
		gap: 0.5rem;
	}

	.empty {
		padding: 1.5rem 0;
		color: var(--pencil);
		border-bottom: 1px solid var(--rule);
	}

	.delete {
		margin-top: 2rem;
		margin-left: -0.6rem;
		font-size: var(--t-sm);
	}

	.delete:hover {
		color: var(--margin);
	}

	.missing {
		padding-block: 4rem;
		display: grid;
		gap: 1.25rem;
		justify-items: start;
	}

	.missing p {
		color: var(--pencil);
	}

	@media (min-width: 900px) {
		.session {
			grid-template-columns: minmax(20rem, 5fr) 7fr;
			gap: 3rem;
			align-items: start;
		}

		.capture {
			position: sticky;
			top: 1.5rem;
		}
	}
</style>
