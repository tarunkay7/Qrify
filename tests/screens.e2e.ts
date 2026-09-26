import { test } from '@playwright/test';
import { useFakeCamera } from './fake-camera';

const out = process.env.SHOTS_DIR;
test.skip(!out, 'screenshots only when SHOTS_DIR is set');

for (const scheme of ['light', 'dark'] as const) {
	test(`screens ${scheme}`, async ({ page }, info) => {
		await page.emulateMedia({ colorScheme: scheme });
		const camera = await useFakeCamera(page);
		const tag = `${info.project.name}-${scheme}`;
		await page.goto('/');
		await page.screenshot({ path: `${out}/${tag}-home-empty.png`, fullPage: true });
		await page.getByLabel('Event name').fill("Freshers' welcome 2026");
		await page.getByRole('button', { name: 'Start taking attendance' }).click();
		const input = page.getByLabel('Or type it in');
		for (const r of ['2410030117', '2410040002', '2310080045', '2410030201', '2210990007']) {
			await input.fill(r);
			await input.press('Enter');
			await page.waitForTimeout(150);
		}
		await camera.show('2410080002');
		await page.getByRole('cell', { name: '2410080002', exact: true }).waitFor({ timeout: 15000 });
		await page.waitForTimeout(400);
		await page.screenshot({ path: `${out}/${tag}-event.png`, fullPage: true });
		await page.getByRole('link', { name: 'Events', exact: true }).click();
		await page.waitForTimeout(300);
		await page.screenshot({ path: `${out}/${tag}-home.png`, fullPage: true });
		await page.getByRole('link', { name: 'Settings' }).click();
		await page.screenshot({ path: `${out}/${tag}-settings.png`, fullPage: true });
	});
}
