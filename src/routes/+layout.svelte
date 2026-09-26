<script lang="ts">
	import '@fontsource-variable/newsreader/opsz.css';
	import '@fontsource/ibm-plex-sans/latin-400.css';
	import '@fontsource/ibm-plex-sans/latin-500.css';
	import '@fontsource/ibm-plex-sans/latin-600.css';
	import '../app.css';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import Logo from '$lib/ui/Logo.svelte';
	import Toaster from '$lib/ui/Toaster.svelte';
	import { settings } from '$lib/stores/settings.svelte';
	import { onMount } from 'svelte';
	import { pwaInfo } from 'virtual:pwa-info';

	let { children } = $props();

	onMount(async () => {
		if (!pwaInfo) return;
		const { registerSW } = await import('virtual:pwa-register');
		registerSW({ immediate: true });
	});

	$effect(() => {
		const root = document.documentElement;
		if (settings.theme === 'system') delete root.dataset.theme;
		else root.dataset.theme = settings.theme;
	});

	const onSettings = $derived(page.route.id === '/settings');
</script>

<svelte:head>
	<title>Qrify</title>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- build-time manifest link from vite-plugin-pwa -->
	{@html pwaInfo?.webManifest.linkTag ?? ''}
</svelte:head>

<a class="skip visually-hidden" href="#main">Skip to content</a>

<header class="bar">
	<a class="brand" href={resolve('/')} aria-label="Qrify, all events">
		<Logo size={26} />
		<span>qrify</span>
	</a>
	<nav aria-label="Main">
		<a href={resolve('/')} aria-current={page.route.id === '/' ? 'page' : undefined}>Events</a>
		<a href={resolve('/settings')} aria-current={onSettings ? 'page' : undefined}>Settings</a>
	</nav>
</header>

<main id="main">
	{@render children()}
</main>

<Toaster />

<style>
	.skip:focus {
		position: fixed !important;
		top: 0.5rem;
		left: 0.5rem;
		width: auto;
		height: auto;
		clip-path: none;
		padding: 0.5rem 0.75rem;
		background: var(--ink);
		color: var(--paper);
		z-index: 100;
	}

	.bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: max(0.9rem, env(safe-area-inset-top)) var(--gutter) 0.9rem;
		max-width: 80rem;
		margin-inline: auto;
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		text-decoration: none;
		font: 500 var(--t-md) / 1 var(--serif);
		letter-spacing: -0.01em;
	}

	nav {
		display: flex;
		gap: 0.25rem;
	}

	nav a {
		padding: 0.5rem 0.7rem;
		font-size: var(--t-sm);
		color: var(--pencil);
		text-decoration: none;
		border-radius: var(--radius);
	}

	nav a:hover,
	nav a[aria-current='page'] {
		color: var(--ink);
	}

	nav a[aria-current='page'] {
		text-decoration: underline;
		text-decoration-color: var(--margin);
		text-decoration-thickness: 2px;
		text-underline-offset: 0.45em;
	}

	main {
		max-width: 80rem;
		margin-inline: auto;
		padding: 0 var(--gutter) 6rem;
	}
</style>
