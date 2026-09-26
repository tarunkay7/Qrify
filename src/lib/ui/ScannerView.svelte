<script lang="ts">
	import { onMount } from 'svelte';
	import {
		activeDeviceId,
		CameraStartError,
		listCameras,
		startCamera,
		stopCamera,
		type CameraError
	} from '$lib/scanner/camera';
	import { preloadDetector, startDecoding } from '$lib/scanner/decoder';

	let { oncode, flash = 0 }: { oncode: (value: string) => void; flash?: number } = $props();

	type Status = 'starting' | 'live' | 'paused' | 'error';

	let video: HTMLVideoElement;
	let status = $state<Status>('starting');
	let error = $state<CameraError>('unknown');
	let cameras = $state<MediaDeviceInfo[]>([]);
	let deviceId = $state<string>();
	let stream: MediaStream | undefined;
	let stopDecoding: (() => void) | undefined;

	const MESSAGES: Record<CameraError, string> = {
		denied: 'Camera access is blocked. Allow it in your browser’s site settings, then try again.',
		unavailable: 'No camera was found on this device.',
		insecure: 'The camera only works over a secure (https) connection.',
		unknown: 'The camera couldn’t start. Close other apps that might be using it and try again.'
	};

	async function start() {
		stop();
		status = 'starting';
		try {
			stream = await startCamera(video, deviceId);
			deviceId = activeDeviceId(stream);
			stopDecoding = startDecoding(video, (v) => oncode(v));
			status = 'live';
			// Labels are only populated once permission is granted.
			cameras = await listCameras();
		} catch (err) {
			error = err instanceof CameraStartError ? err.kind : 'unknown';
			status = 'error';
		}
	}

	function stop() {
		stopDecoding?.();
		stopDecoding = undefined;
		stopCamera(stream);
		stream = undefined;
	}

	function pause() {
		stop();
		status = 'paused';
	}

	function switchCamera() {
		const i = cameras.findIndex((c) => c.deviceId === deviceId);
		deviceId = cameras[(i + 1) % cameras.length]?.deviceId;
		void start();
	}

	onMount(() => {
		void preloadDetector();
		void start();

		const onVisibility = () => {
			if (document.hidden && status === 'live') {
				stop();
				status = 'paused';
				resumeOnReturn = true;
			} else if (!document.hidden && resumeOnReturn) {
				resumeOnReturn = false;
				void start();
			}
		};
		let resumeOnReturn = false;
		document.addEventListener('visibilitychange', onVisibility);
		return () => {
			document.removeEventListener('visibilitychange', onVisibility);
			stop();
		};
	});
</script>

<div class="scanner" data-status={status}>
	<div class="frame">
		<video bind:this={video} playsinline muted aria-label="Camera preview"></video>

		{#key flash}
			<div class="corners" class:hit={flash > 0} aria-hidden="true">
				<span></span><span></span><span></span><span></span>
			</div>
		{/key}

		{#if status === 'starting'}
			<p class="overlay">Starting camera…</p>
		{:else if status === 'paused'}
			<div class="overlay">
				<p>Camera paused.</p>
				<button class="btn" onclick={start}>Resume camera</button>
			</div>
		{:else if status === 'error'}
			<div class="overlay">
				<p>{MESSAGES[error]}</p>
				{#if error !== 'insecure' && error !== 'unavailable'}
					<button class="btn" onclick={start}>Try again</button>
				{/if}
			</div>
		{/if}
	</div>

	<div class="controls">
		<p class="hint">
			{#if status === 'live'}Hold the QR code inside the frame.{:else}&nbsp;{/if}
		</p>
		{#if status === 'live'}
			{#if cameras.length > 1}
				<button class="btn btn-quiet" onclick={switchCamera}>Switch camera</button>
			{/if}
			<button class="btn btn-quiet" onclick={pause}>Pause</button>
		{/if}
	</div>
</div>

<style>
	.frame {
		position: relative;
		aspect-ratio: 4 / 3;
		overflow: hidden;
		border-radius: var(--radius);
		background: var(--ink);
		color: var(--paper);
	}

	video {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	[data-status='error'] video,
	[data-status='paused'] video {
		visibility: hidden;
	}

	.corners {
		position: absolute;
		inset: 14% 22%;
		pointer-events: none;
		--c: color-mix(in srgb, var(--paper) 85%, transparent);
	}

	.corners span {
		position: absolute;
		width: 2.25rem;
		height: 2.25rem;
		border: 3px solid var(--c);
	}

	.corners span:nth-child(1) {
		top: 0;
		left: 0;
		border-width: 3px 0 0 3px;
	}
	.corners span:nth-child(2) {
		top: 0;
		right: 0;
		border-width: 3px 3px 0 0;
	}
	.corners span:nth-child(3) {
		bottom: 0;
		left: 0;
		border-width: 0 0 3px 3px;
	}
	.corners span:nth-child(4) {
		bottom: 0;
		right: 0;
		border-width: 0 3px 3px 0;
	}

	.corners.hit {
		animation: stamp 520ms var(--ease);
	}

	@keyframes stamp {
		0% {
			--c: var(--margin);
			transform: scale(1.06);
		}
		60% {
			--c: var(--margin);
			transform: scale(1);
		}
	}

	[data-status='error'] .corners,
	[data-status='paused'] .corners {
		display: none;
	}

	.overlay {
		position: absolute;
		inset: 0;
		display: grid;
		place-content: center;
		justify-items: center;
		gap: 1rem;
		padding: 1.5rem;
		text-align: center;
		margin: 0;
		max-width: none;
	}

	.overlay .btn {
		color: var(--paper);
		border-color: var(--paper);
	}

	.overlay .btn:hover {
		background: color-mix(in srgb, var(--paper) 12%, transparent);
	}

	.controls {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		min-height: 3rem;
	}

	.hint {
		flex: 1;
		font-size: var(--t-sm);
		color: var(--pencil);
	}
</style>
