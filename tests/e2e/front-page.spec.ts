import { expect, Page, test } from '@playwright/test';

function trackPageIssues(page: Page) {
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

  return () => {
    expect(pageErrors, 'unexpected uncaught page errors').toEqual([]);
    expect(consoleIssues, 'unexpected browser console warnings or errors').toEqual([]);
  };
}

async function expectBackgroundImage(page: Page) {
  const background = page.locator('.bgImage-container').first();
  await expect(background).toBeVisible();

  await expect
    .poll(() =>
      background.evaluate((element) => getComputedStyle(element).backgroundImage)
    )
    .toMatch(/^url\(["']?(?!undefined|null|none)/);
}

async function expectPoemLines(page: Page) {
  const poemLines = page.locator('.poem-line-input');
  await expect(poemLines.first()).toBeVisible();

  await expect
    .poll(async () => {
      const lineTexts = await poemLines.allTextContents();
      return lineTexts.map((text) => text.trim()).filter(Boolean).length;
    })
    .toBe(3);
}

async function pauseAtEnd(page: Page) {
  const endPauseMs = Number(process.env.PLAYWRIGHT_END_PAUSE_MS || 0);
  if (endPauseMs > 0) {
    await page.waitForTimeout(endPauseMs);
  }
}

for (const mode of ['haiku', 'showcase']) {
  test(`front page loads a haiku with a background image in ${mode} mode`, async ({ page }) => {
    const expectNoPageIssues = trackPageIssues(page);

    await page.goto(`/?mode=${mode}&noOnboarding=true`);
    await expectBackgroundImage(page);
    await expectPoemLines(page);
    await pauseAtEnd(page);

    expectNoPageIssues();
  });
}

test('front page loads a Haikudle puzzle with a background image in haikudle mode', async ({ page }) => {
  const expectNoPageIssues = trackPageIssues(page);

  await page.goto('/?mode=haikudle&noOnboarding=true');
  await expectBackgroundImage(page);

  const puzzle = page.getByTestId('haikudle-puzzle');
  await expect(puzzle).toBeVisible({ timeout: 30_000 });

  await expect
    .poll(async () => (await puzzle.innerText()).trim().split(/\s+/).filter(Boolean).length)
    .toBeGreaterThan(0);

  await pauseAtEnd(page);
  expectNoPageIssues();
});
