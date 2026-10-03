import { expect, Page, test } from '@playwright/test';
import { readFile } from 'fs/promises';

const webServerLogPath = 'test-results/webserver.log';

function trackPageIssues(page: Page) {
  const consoleIssues: string[] = [];
  const pageErrors: string[] = [];
  const serverIssues: string[] = [];

  page.on('console', (message) => {
    if (['warning', 'error'].includes(message.type())) {
      consoleIssues.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });
  page.on('response', (response) => {
    if (response.status() >= 500) {
      const request = response.request();
      serverIssues.push(`${request.method()} ${response.url()} returned ${response.status()}`);
    }
  });
  page.on('requestfailed', (request) => {
    const url = new URL(request.url());
    const isAppRequest = url.origin === new URL(page.url()).origin;

    if (isAppRequest) {
      serverIssues.push(`${request.method()} ${request.url()} failed: ${request.failure()?.errorText}`);
    }
  });

  return async () => {
    expect(pageErrors, 'unexpected uncaught page errors').toEqual([]);
    expect(consoleIssues, 'unexpected browser console warnings or errors').toEqual([]);
    expect(serverIssues, 'unexpected failed requests or server errors').toEqual([]);

    const webServerLog = await readFile(webServerLogPath, 'utf8').catch(() => '');
    const serverErrorLines = webServerLog
      .split('\n')
      .filter((line) => line.includes('⨯'));

    expect(serverErrorLines, 'unexpected server-side errors in the Next dev-server log').toEqual([]);
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

async function expectVisibleOverlayedControls(page: Page, expected: 'present' | 'absent') {
  const visibleOverlayedControlCount = () =>
    page.locator('.overlayed-control').evaluateAll((elements) =>
      elements.filter((element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.visibility !== 'hidden'
          && style.display !== 'none'
          && Number(style.opacity) > 0
          && rect.width > 0
          && rect.height > 0;
      }).length
    );

  if (expected === 'present') {
    await expect.poll(visibleOverlayedControlCount).toBeGreaterThan(0);
  } else {
    await expect.poll(visibleOverlayedControlCount).toBe(0);
  }
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
    await expectVisibleOverlayedControls(page, mode === 'haiku' ? 'present' : 'absent');
    await pauseAtEnd(page);

    await expectNoPageIssues();
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
  await expectNoPageIssues();
});

async function currentHaikuId(page: Page) {
  return new URL(page.url()).pathname.split('/').filter(Boolean).pop();
}

async function generateHaiku(page: Page) {
  // Generating before the initial haiku arrives lets that late response replace the
  // generated haiku.
  const initialHaiku = page.waitForResponse((response) =>
    response.request().method() === 'GET' && /\/api\/haikus\/[^/]+$/.test(new URL(response.url()).pathname)
  );
  await page.goto('/?mode=haiku&noOnboarding=true');
  await initialHaiku;
  await expectPoemLines(page);
  const initialId = await currentHaikuId(page);

  // Generate takes the subject from the input; the window.prompt path is only a fallback.
  page.on('dialog', (dialog) => dialog.accept('test subject'));

  await page.locator('.GenerateInput textarea').fill('test subject');
  await page.getByTitle('Create a new haiku', { exact: true }).click();

  await expect.poll(() => currentHaikuId(page), { timeout: 30_000 }).not.toBe(initialId);
  // The URL changes before the new haiku renders.
  await expect(page.locator('.poem-line-input').first()).toContainText('Mock haiku about', { timeout: 30_000 });
  await expectBackgroundImage(page);
  await expectPoemLines(page);
}

test('generating a haiku renders a new haiku with a background image', async ({ page }) => {
  const expectNoPageIssues = trackPageIssues(page);

  await generateHaiku(page);

  await pauseAtEnd(page);
  await expectNoPageIssues();
});

test('regenerating the image of a generated haiku renders the updated haiku', async ({ page }) => {
  const expectNoPageIssues = trackPageIssues(page);

  const generated = page.waitForResponse((response) =>
    response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/haikus'
  );
  await generateHaiku(page);
  const { haiku } = await (await generated).json();
  expect(haiku.version ?? 0).toBe(0);

  const regenerated = page.waitForResponse((response) =>
    response.request().method() === 'POST' && new URL(response.url()).pathname === `/api/haikus/${haiku.id}/regenerate`
  );
  // The click handler is on the icon, not its titled wrapper.
  await page.getByTitle("Regenerate this haiku's art with the same theme", { exact: true }).locator('svg').click();
  const response = await regenerated;
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.haiku.id).toBe(haiku.id);
  expect(body.haiku.version).toBe(1);
  expect(body.haiku.bgImage).toMatch(/^data:image\/png;base64,/);

  await expectBackgroundImage(page);
  await expectPoemLines(page);

  await pauseAtEnd(page);
  await expectNoPageIssues();
});
