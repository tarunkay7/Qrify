<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		open = $bindable(false),
		title,
		confirmLabel,
		cancelLabel = 'Cancel',
		onconfirm,
		children
	}: {
		open?: boolean;
		title: string;
		confirmLabel: string;
		cancelLabel?: string;
		onconfirm: () => void;
		children: Snippet;
	} = $props();

	let dialog: HTMLDialogElement;

	$effect(() => {
		if (open && !dialog.open) dialog.showModal();
		if (!open && dialog.open) dialog.close();
	});
</script>

<dialog bind:this={dialog} onclose={() => (open = false)} aria-labelledby="confirm-title">
	<h2 id="confirm-title">{title}</h2>
	<div class="body">{@render children()}</div>
	<div class="actions">
		<button class="btn" onclick={() => (open = false)}>{cancelLabel}</button>
		<button
			class="btn btn-primary"
			onclick={() => {
				open = false;
				onconfirm();
			}}>{confirmLabel}</button
		>
	</div>
</dialog>

<style>
	dialog {
		width: min(100% - 2rem, 26rem);
		padding: 1.75rem;
		color: var(--ink);
		background: var(--paper);
		border: 1px solid var(--rule);
		border-radius: var(--radius);
	}

	dialog::backdrop {
		background: color-mix(in srgb, var(--ink) 45%, transparent);
	}

	h2 {
		font-size: var(--t-lg);
	}

	.body {
		margin: 0.75rem 0 1.5rem;
		color: var(--pencil);
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
</style>
