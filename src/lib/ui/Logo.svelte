<script lang="ts">
	let { size = 28 }: { size?: number } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
	<g fill="none" stroke="currentColor" stroke-width="2.4">
		<rect x="3" y="3" width="10" height="10" rx="1.5" />
		<rect x="19" y="3" width="10" height="10" rx="1.5" />
		<rect x="3" y="19" width="10" height="10" rx="1.5" />
	</g>
	<g fill="currentColor">
		<rect x="6.6" y="6.6" width="2.8" height="2.8" />
		<rect x="22.6" y="6.6" width="2.8" height="2.8" />
		<rect x="6.6" y="22.6" width="2.8" height="2.8" />
	</g>
	<path
		d="M18.5 24.2l3.6 3.6 7.2-8.3"
		fill="none"
		stroke="var(--margin)"
		stroke-width="3"
		stroke-linecap="round"
		stroke-linejoin="round"
	/>
</svg>
