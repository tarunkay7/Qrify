<script lang="ts">
	import { toasts } from '$lib/stores/toasts.svelte';
</script>

<div class="toaster" role="status" aria-live="polite">
	{#each toasts.items as toast (toast.id)}
		<div class="toast" data-tone={toast.tone}>
			<span>{toast.message}</span>
			{#if toast.action}
				<button
					class="action"
					onclick={() => {
						toast.action?.run();
						toasts.dismiss(toast.id);
					}}>{toast.action.label}</button
				>
			{/if}
			<button class="close" aria-label="Dismiss" onclick={() => toasts.dismiss(toast.id)}>
				<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"
					><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.6" /></svg
				>
			</button>
		</div>
	{/each}
</div>

<style>
	.toaster {
		position: fixed;
		inset: auto 0 0 0;
		z-index: 50;
		display: grid;
		justify-items: center;
		gap: 0.5rem;
		padding: 1rem var(--gutter) max(1rem, env(safe-area-inset-bottom));
		pointer-events: none;
	}

	.toast {
		pointer-events: auto;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: min(100%, 28rem);
		padding: 0.7rem 0.6rem 0.7rem 1rem;
		background: var(--ink);
		color: var(--paper);
		border-radius: var(--radius);
		border-left: 4px solid var(--paper);
		font-size: var(--t-sm);
		animation: rise 180ms var(--ease);
	}

	.toast span {
		flex: 1;
	}

	.toast[data-tone='success'] {
		border-left-color: var(--margin);
	}
	.toast[data-tone='warning'] {
		border-left-color: var(--warn);
	}
	.toast[data-tone='error'] {
		border-left-color: var(--margin);
		background: var(--margin);
		color: var(--on-margin);
	}

	button {
		font: inherit;
		color: inherit;
		background: none;
		border: 0;
		cursor: pointer;
	}

	.action {
		font-weight: 600;
		text-decoration: underline;
		text-underline-offset: 0.2em;
		padding: 0.4rem;
	}

	.close {
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		opacity: 0.7;
	}

	@keyframes rise {
		from {
			transform: translateY(8px);
			opacity: 0;
		}
	}

	@media (min-width: 900px) {
		.toaster {
			justify-items: end;
		}
	}
</style>
