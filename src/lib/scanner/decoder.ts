import { createCooldown } from './cooldown';

interface Detector {
	detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]>;
}

const SCAN_INTERVAL_MS = 120;
const COOLDOWN_MS = 2500;

let detectorPromise: Promise<Detector> | undefined;

/** Native BarcodeDetector where it supports QR, otherwise the bundled zxing-wasm ponyfill. */
function getDetector(): Promise<Detector> {
	detectorPromise ??= (async () => {
		const native = (
			globalThis as { BarcodeDetector?: typeof import('barcode-detector').BarcodeDetector }
		).BarcodeDetector;
		if (native && (await native.getSupportedFormats()).includes('qr_code')) {
			return new native({ formats: ['qr_code'] });
		}
		const [{ BarcodeDetector, prepareZXingModule }, { default: wasmUrl }] = await Promise.all([
			import('barcode-detector/ponyfill'),
			import('zxing-wasm/reader/zxing_reader.wasm?url')
		]);
		// Serve the wasm from our own origin so scanning works offline.
		prepareZXingModule({
			overrides: {
				locateFile: (path: string, prefix: string) =>
					path.endsWith('.wasm') ? wasmUrl : prefix + path
			}
		});
		return new BarcodeDetector({ formats: ['qr_code'] });
	})();
	return detectorPromise;
}

/** Warm up the decoder (loads wasm if needed) before the camera is ready. */
export const preloadDetector = () => getDetector().then(() => undefined);

/**
 * Continuously decodes QR codes from `video`, calling `onCode` once per card
 * presentation. Returns a function that stops the loop.
 */
export function startDecoding(
	video: HTMLVideoElement,
	onCode: (value: string) => void
): () => void {
	const allow = createCooldown(COOLDOWN_MS);
	let stopped = false;
	let busy = false;
	let last = 0;
	let handle = 0;

	const schedule = () => {
		if (stopped) return;
		handle =
			'requestVideoFrameCallback' in video
				? video.requestVideoFrameCallback(tick)
				: requestAnimationFrame(tick);
	};

	const tick = async () => {
		const now = performance.now();
		if (!busy && now - last >= SCAN_INTERVAL_MS && video.readyState >= 2) {
			busy = true;
			last = now;
			try {
				const detector = await getDetector();
				const codes = await detector.detect(video);
				for (const { rawValue } of codes) {
					if (!stopped && rawValue && allow(rawValue, performance.now())) onCode(rawValue);
				}
			} catch {
				// A single failed frame is not worth surfacing; the next one will retry.
			} finally {
				busy = false;
			}
		}
		schedule();
	};

	schedule();
	return () => {
		stopped = true;
		if ('cancelVideoFrameCallback' in video) video.cancelVideoFrameCallback(handle);
		else cancelAnimationFrame(handle);
	};
}
