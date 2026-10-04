import { expect, Page, Request, Response, test } from '@playwright/test';
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

// Mid-transition, Chrome reports `-webkit-cross-fade(<from>, <to>, <progress>)`.
async function backgroundImage(page: Page) {
  return page.locator('.bgImage-container').first().evaluate((element) => getComputedStyle(element).backgroundImage);
}

async function streamedEvents(response: Response) {
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/x-ndjson');
  return (await response.text()).split('\n').filter(Boolean).map((line) => JSON.parse(line));
}

function eventNames(events: any[]) {
  return events.map((event) => event.type == 'partial' ? `partial ${event.index}` : event.type);
}

const isPost = (pathname: string) => (request: Request) =>
  request.method() === 'POST' && new URL(request.url()).pathname === pathname;

// Response events fire on headers, at the start of a stream. requestfinished fires at its end.
function streamFinished(page: Page, pathname: string) {
  let finished = false;
  page.waitForEvent('requestfinished', isPost(pathname)).then(() => finished = true, () => {});
  return () => finished;
}

// The swap eases this element's blur and image. A new element would jump straight to the end.
async function markBackground(page: Page) {
  await page.locator('.bgImage-container').first().evaluate((element) => element.setAttribute('data-e2e-kept', ''));
}

async function expectBackgroundKept(page: Page) {
  await expect(page.locator('.bgImage-container[data-e2e-kept]')).toHaveCount(1);
}

// The preview streams in before the haiku is saved: a blob: background, then the saved data: one.
async function expectPreviewThenSaved(page: Page, { saved, poemDuringPreview }: {
  saved: () => boolean,
  poemDuringPreview: boolean,
}) {
  await expect.poll(() => backgroundImage(page), { timeout: 30_000 }).toContain('blob:');
  const poemLines = page.locator('.poem-line-input');
  if (poemDuringPreview) {
    await expect(poemLines.first()).toContainText('Mock haiku about');
  } else {
    expect(await poemLines.count(), 'poem showed before the haiku was saved').toBe(0);
  }
  expect(saved(), 'preview showed after the haiku was saved').toBe(false);

  await expect.poll(() => backgroundImage(page), { timeout: 30_000 }).toMatch(/^url\("data:image\/png;base64,/);
}

async function loadHaikuPage(page: Page) {
  // Generating before the initial haiku arrives lets that late response replace the
  // generated haiku.
  const initialHaiku = page.waitForResponse((response) =>
    response.request().method() === 'GET' && /\/api\/haikus\/[^/]+$/.test(new URL(response.url()).pathname)
  );
  await page.goto('/?mode=haiku&noOnboarding=true');
  await initialHaiku;
  await expectPoemLines(page);
}

async function clickGenerate(page: Page, subject: string) {
  // Generate takes the subject from the input; the window.prompt path is only a fallback.
  page.on('dialog', (dialog) => dialog.accept(subject));
  await page.locator('.GenerateInput textarea').fill(subject);
  await page.getByTitle('Create a new haiku', { exact: true }).click();
}

async function generateHaiku(page: Page) {
  await loadHaikuPage(page);
  const initialId = await currentHaikuId(page);
  await markBackground(page);

  const generated = page.waitForResponse((response) => isPost('/api/haikus')(response.request()));
  const saved = streamFinished(page, '/api/haikus');
  await clickGenerate(page, 'test subject');

  // The poem comes with the saved haiku, not before.
  await expectPreviewThenSaved(page, { saved, poemDuringPreview: false });
  await expectPoemLines(page);
  await expectBackgroundKept(page);

  const events = await streamedEvents(await generated);
  expect(eventNames(events)).toEqual(['partial 0', 'haiku']);

  const { haiku } = events[events.length - 1];
  await expect.poll(() => currentHaikuId(page)).not.toBe(initialId);
  expect(await currentHaikuId(page)).toBe(haiku.id);
  return haiku;
}

test('generating a haiku streams a preview, then renders the saved haiku', async ({ page }) => {
  const expectNoPageIssues = trackPageIssues(page);

  await generateHaiku(page);

  await pauseAtEnd(page);
  await expectNoPageIssues();
});

test('regenerating the image of a generated haiku streams a preview, then renders the updated haiku', async ({ page }) => {
  const expectNoPageIssues = trackPageIssues(page);

  const haiku = await generateHaiku(page);
  expect(haiku.version ?? 0).toBe(0);

  const pathname = `/api/haikus/${haiku.id}/regenerate`;
  const regenerated = page.waitForResponse((response) => isPost(pathname)(response.request()));
  const saved = streamFinished(page, pathname);

  // The click handler is on the icon, not its titled wrapper.
  await page.getByTitle("Regenerate this haiku's art with the same theme", { exact: true }).locator('svg').click();

  // The poem stays up over the new image.
  await expectPreviewThenSaved(page, { saved, poemDuringPreview: true });
  await expectPoemLines(page);
  await expectBackgroundKept(page);

  const events = await streamedEvents(await regenerated);
  expect(eventNames(events)).toEqual(['partial 0', 'haiku']);
  const { haiku: updated } = events[events.length - 1];
  expect(updated.id).toBe(haiku.id);
  expect(updated.version).toBe(1);

  await pauseAtEnd(page);
  await expectNoPageIssues();
});

test('generating in haikudle mode streams the image but keeps the poem hidden until saved', async ({ page }) => {
  const expectNoPageIssues = trackPageIssues(page);

  await page.goto('/?mode=haikudle&noOnboarding=true');
  await expect(page.getByTestId('haikudle-puzzle')).toBeVisible({ timeout: 30_000 });

  const generated = page.waitForResponse((response) => isPost('/api/haikus')(response.request()));
  const saved = streamFinished(page, '/api/haikus');
  await clickGenerate(page, 'test subject');

  await expectPreviewThenSaved(page, { saved, poemDuringPreview: false });
  expect(eventNames(await streamedEvents(await generated))).toEqual(['partial 0', 'haiku']);

  await pauseAtEnd(page);
  await expectNoPageIssues();
});

test('generating without asking for a stream returns plain JSON', async ({ page }) => {
  await loadHaikuPage(page);
  const token = await page.evaluate(() => localStorage.getItem('session'));

  const response = await page.request.post('/api/haikus', {
    headers: { authorization: `Bearer ${token}` },
    data: { request: { subject: 'json subject' } },
  });

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/json');
  const { haiku } = await response.json();
  expect(haiku.poem).toEqual(['Mock haiku about', 'json subject', 'written by no one.']);
  expect(haiku.bgImage).toMatch(/^data:image\/png;base64,/);
});
