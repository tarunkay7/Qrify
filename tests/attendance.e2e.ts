import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { useFakeCamera } from './fake-camera';

async function startEvent(page: Page, name = 'Freshers welcome') {
	await page.goto('/');
	await page.getByLabel('Event name').fill(name);
	await page.getByRole('button', { name: 'Start taking attendance' }).click();
	await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
}

const register = (page: Page) => page.getByRole('table');
const rollCell = (page: Page, roll: string) =>
	register(page).getByRole('cell', { name: roll, exact: true });
const count = (page: Page) => page.locator('.count .num');

test('a scanned ID card is checked in and survives a reload', async ({ page }) => {
	const camera = await useFakeCamera(page);
	await startEvent(page);
	await camera.show('2410030117');

	await expect(rollCell(page, '2410030117')).toBeVisible({ timeout: 15_000 });
	await expect(register(page).getByRole('cell', { name: 'CSE' })).toBeVisible();
	await expect(count(page)).toHaveText('1');

	await page.reload();
	await expect(rollCell(page, '2410030117')).toBeVisible();
});

test('a card held in view counts once; showing it again is flagged as a repeat', async ({
	page
}) => {
	const camera = await useFakeCamera(page);
	await startEvent(page);
	await camera.show('2410040002');
	await expect(count(page)).toHaveText('1', { timeout: 15_000 });

	// Still in view: the cooldown keeps it from being re-read every frame.
	await page.waitForTimeout(1500);
	await expect(page.getByText(/already checked in/)).toHaveCount(0);

	await camera.hide();
	await page.waitForTimeout(2800);
	await camera.show('2410040002');
	await expect(page.getByText('2410040002 already checked in')).toBeVisible({ timeout: 10_000 });
	await expect(count(page)).toHaveText('1');
});

test('typed entries are validated, and removals can be undone', async ({ page }) => {
	await useFakeCamera(page);
	await startEvent(page);
	const input = page.getByLabel('Or type it in');

	await input.fill('12345');
	await input.press('Enter');
	await expect(page.getByText('Roll numbers are 10 digits — got 5.')).toBeVisible();
	await expect(input).toHaveValue('12345');

	await input.fill('2410080002');
	await input.press('Enter');
	await expect(rollCell(page, '2410080002')).toBeVisible();
	await expect(input).toHaveValue('');

	await page.getByRole('button', { name: 'Remove 2410080002' }).click();
	await expect(register(page)).toHaveCount(0);
	await page.getByRole('button', { name: 'Undo' }).click();
	await expect(rollCell(page, '2410080002')).toBeVisible();
});

test('the register downloads as CSV with derived columns', async ({ page }) => {
	await useFakeCamera(page);
	await startEvent(page, 'Hack night 26');
	const input = page.getByLabel('Or type it in');
	for (const roll of ['2410030117', '2410040002']) {
		await input.fill(roll);
		await input.press('Enter');
		await expect(rollCell(page, roll)).toBeVisible();
	}

	const [download] = await Promise.all([
		page.waitForEvent('download'),
		page.getByRole('button', { name: 'CSV' }).click()
	]);
	expect(download.suggestedFilename()).toMatch(/^hack-night-26-\d{4}-\d{2}-\d{2}\.csv$/);
	const text = await readFile(await download.path(), 'utf8');
	expect(text.charCodeAt(0)).toBe(0xfeff);
	const lines = text.slice(1).split('\r\n');
	expect(lines[0]).toBe('#,Roll number,Email,Dept,Year,Checked in,Source');
	expect(lines[1]).toMatch(/^1,2410030117,2410030117@klh\.edu\.in,CSE,Y24,.+,manual$/);
	expect(lines[2]).toMatch(/^2,2410040002,2410040002@klh\.edu\.in,ECE,Y24,.+,manual$/);
});

test('the Excel download produces an xlsx file', async ({ page }) => {
	await useFakeCamera(page);
	await startEvent(page);
	const input = page.getByLabel('Or type it in');
	await input.fill('2410030117');
	await input.press('Enter');
	await expect(rollCell(page, '2410030117')).toBeVisible();

	const [download] = await Promise.all([
		page.waitForEvent('download'),
		page.getByRole('button', { name: 'Download Excel' }).click()
	]);
	expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
	const bytes = await readFile(await download.path());
	expect(bytes.subarray(0, 2).toString()).toBe('PK'); // xlsx is a zip archive
});

test('events are listed on the home page and can be deleted', async ({ page }) => {
	await useFakeCamera(page);
	await startEvent(page, 'Orientation');
	await page.getByRole('link', { name: 'Events', exact: true }).click();
	await expect(page.getByRole('link', { name: /Orientation/ })).toContainText('0 present');

	await page.getByRole('link', { name: /Orientation/ }).click();
	await page.getByRole('button', { name: 'Delete this event' }).click();
	await page.getByRole('dialog').getByRole('button', { name: 'Delete event' }).click();
	await expect(page.getByText('Deleted Orientation.')).toBeVisible();
	await expect(page.getByRole('link', { name: /Orientation/ })).toHaveCount(0);
});
