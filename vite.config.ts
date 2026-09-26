import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

// GitHub Pages serves the app from /Qrify; local dev and preview use the root.
const base = (process.env.BASE_PATH ?? '') as '' | `/${string}`;

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// SPA fallback so /events/<id> works on a static host after a reload.
			adapter: adapter({ fallback: '404.html' }),
			paths: { base }
		}),
		SvelteKitPWA({
			base: `${base}/`,
			scope: `${base}/`,
			registerType: 'autoUpdate',
			// Explicit: without it the plugin precaches index.html as the domain root, not the base.
			kit: { base: `${base}/`, adapterFallback: '404.html', spa: true },
			manifest: {
				name: 'Qrify — attendance by ID card',
				short_name: 'Qrify',
				description: 'Take attendance at events by scanning the QR code on student ID cards.',
				start_url: `${base}/`,
				scope: `${base}/`,
				display: 'standalone',
				background_color: '#f1eee4',
				theme_color: '#f1eee4',
				icons: [
					{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
					{ src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
					{
						src: 'maskable-icon-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					}
				]
			},
			workbox: {
				// Precache everything, including the QR decoder wasm, so the app works offline at the door.
				globPatterns: ['client/**/*.{js,css,html,ico,png,svg,woff2,wasm,webmanifest}'],
				maximumFileSizeToCacheInBytes: 3 * 1024 * 1024
			}
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
