export type CameraError = 'denied' | 'unavailable' | 'insecure' | 'unknown';

export class CameraStartError extends Error {
	constructor(readonly kind: CameraError) {
		super(kind);
	}
}

/** Starts a camera stream into `video`. Prefers the rear camera when no device is given. */
export async function startCamera(
	video: HTMLVideoElement,
	deviceId?: string
): Promise<MediaStream> {
	if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
		throw new CameraStartError(window.isSecureContext ? 'unavailable' : 'insecure');
	}
	try {
		const stream = await navigator.mediaDevices.getUserMedia({
			audio: false,
			video: deviceId
				? { deviceId: { exact: deviceId } }
				: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
		});
		video.srcObject = stream;
		video.muted = true;
		video.playsInline = true;
		await video.play();
		return stream;
	} catch (err) {
		const name = err instanceof DOMException ? err.name : '';
		if (name === 'NotAllowedError' || name === 'SecurityError')
			throw new CameraStartError('denied');
		if (name === 'NotFoundError' || name === 'OverconstrainedError')
			throw new CameraStartError('unavailable');
		throw new CameraStartError('unknown');
	}
}

export function stopCamera(stream: MediaStream | undefined) {
	stream?.getTracks().forEach((t) => t.stop());
}

export async function listCameras(): Promise<MediaDeviceInfo[]> {
	const devices = await navigator.mediaDevices.enumerateDevices();
	return devices.filter((d) => d.kind === 'videoinput');
}

export function activeDeviceId(stream: MediaStream): string | undefined {
	return stream.getVideoTracks()[0]?.getSettings().deviceId;
}
