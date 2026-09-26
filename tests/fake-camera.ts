import type { Page } from '@playwright/test';
import QRCode from 'qrcode';

type FakeWindow = { __showQr: (src: string | null) => void };

/**
 * Replaces the camera with a canvas stream. `show(text)` renders a QR code
 * into the "camera"; `hide()` shows an empty frame.
 */
export async function useFakeCamera(page: Page) {
	await page.addInitScript(() => {
		const canvas = document.createElement('canvas');
		canvas.width = 640;
		canvas.height = 480;
		const ctx = canvas.getContext('2d')!;
		let img: HTMLImageElement | null = null;
		(window as unknown as FakeWindow).__showQr = (src) => {
			if (!src) {
				img = null;
				return;
			}
			const next = new Image();
			next.onload = () => (img = next);
			next.src = src;
		};
		setInterval(() => {
			ctx.fillStyle = '#ddd';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			if (img) ctx.drawImage(img, 200, 120, 240, 240);
		}, 50);
		const stream = canvas.captureStream(20);
		navigator.mediaDevices.getUserMedia = async () => stream;
		navigator.mediaDevices.enumerateDevices = async () => [
			{
				kind: 'videoinput',
				deviceId: 'fake',
				groupId: 'fake',
				label: 'Fake camera'
			} as MediaDeviceInfo
		];
	});

	return {
		async show(text: string) {
			const src = await QRCode.toDataURL(text, { margin: 2, width: 240 });
			await page.evaluate((s) => (window as unknown as FakeWindow).__showQr(s), src);
		},
		hide: () => page.evaluate(() => (window as unknown as FakeWindow).__showQr(null))
	};
}
