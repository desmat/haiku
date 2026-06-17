import { expect, test } from '@playwright/test';

test('front page loads a haiku with a background image in haiku mode', async ({ page }) => {
  const consoleIssues: string[] = [];
  const pageErrors: string[] = [];

  page.on('console', (message) => {
    if (['warning', 'error'].includes(message.type())) {
      consoleIssues.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  await page.goto('/?mode=haiku&noOnboarding=true');

  const background = page.locator('.bgImage-container').first();
  await expect(background).toBeVisible();

  await expect
    .poll(() =>
      background.evaluate((element) => getComputedStyle(element).backgroundImage)
    )
    .toMatch(/^url\(["']?(?!undefined|null|none)/);

  const poemLines = page.locator('.poem-line-input');
  await expect(poemLines.first()).toBeVisible();

  await expect
    .poll(async () => {
      const lineTexts = await poemLines.allTextContents();
      return lineTexts.map((text) => text.trim()).filter(Boolean).length;
    })
    .toBe(3);

  const endPauseMs = Number(process.env.PLAYWRIGHT_END_PAUSE_MS || 0);
  if (endPauseMs > 0) {
    await page.waitForTimeout(endPauseMs);
  }

  expect(pageErrors, 'unexpected uncaught page errors').toEqual([]);
  expect(consoleIssues, 'unexpected browser console warnings or errors').toEqual([]);
});
