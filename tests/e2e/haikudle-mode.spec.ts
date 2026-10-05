import { expect, Page, test } from '@playwright/test';
import { pauseAtEnd, trackPageIssues } from './helpers';
import { backgroundBlur, loadPuzzle, solvePuzzle, tiles, titleOpacity } from './puzzle-helpers';

// Runs against a server in haikudle mode, like haikudle.ai. The memory store seeds
// yesterday's daily haikudle as haiku 7 and the day before's as haiku 8.

// Stored once the app has loaded the user.
async function sessionToken(page: Page) {
  await expect.poll(() => page.evaluate(() => localStorage.getItem('session'))).toBeTruthy();
  return page.evaluate(() => localStorage.getItem('session'));
}

async function expectSolvedPuzzle(page: Page) {
  await expect(page.getByTestId('haikudle-puzzle').locator('[data-word-id]').first()).toBeVisible();
  await expect(page.locator(`${tiles}.cursor-grab`)).toHaveCount(0);
  await expect.poll(() => backgroundBlur(page)).toBe(0);
  await expect.poll(() => titleOpacity(page)).toBe('1');
}

// Shown as a haiku: the poem, no puzzle.
async function expectSolvedHaiku(page: Page, haikuId: string) {
  const token = await sessionToken(page);
  const response = await page.request.get(`/api/haikudles/${haikuId}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  const { haikudle } = await response.json();
  expect(haikudle.previousDailyHaikudleId, `haiku ${haikuId} should be a previous daily`).toBeTruthy();

  await expect(page.locator('.poem-line-input').first()).toHaveText(haikudle.haiku.poem[0]);
  await expect(page.getByTestId('haikudle-puzzle')).toHaveCount(0);
}

function savedToUser(page: Page) {
  return page.waitForResponse((response) =>
    response.request().method() === 'POST' && /^\/api\/user\/[^/]+\/haikus$/.test(new URL(response.url()).pathname)
  );
}

test("today's haiku is a puzzle, then stays solved once solved", async ({ context, page }) => {
  // A dozen moves, then a second visit.
  test.slow();
  const expectNoPageIssues = trackPageIssues(page);
  const puzzle = await loadPuzzle(page, '/?noOnboarding=true');
  await expect(page.locator(`${tiles}.cursor-grab`).first()).toBeVisible();

  const saved = savedToUser(page);
  await solvePuzzle(page, puzzle);
  await saved;
  await expectSolvedPuzzle(page);

  // A new tab shares the session. A reload would abort requests still in flight.
  const revisit = await context.newPage();
  const expectNoRevisitIssues = trackPageIssues(revisit);
  await loadPuzzle(revisit, '/?noOnboarding=true');
  await expectSolvedPuzzle(revisit);

  await pauseAtEnd(revisit);
  await expectNoPageIssues();
  await expectNoRevisitIssues();
});

test('a previous daily haiku from a link shows solved', async ({ page }) => {
  const expectNoPageIssues = trackPageIssues(page);

  await page.goto('/7?noOnboarding=true');
  await expectSolvedHaiku(page, '7');

  await pauseAtEnd(page);
  await expectNoPageIssues();
});

test('a previous daily haiku shows solved, whether or not the user solved it', async ({ page }) => {
  const expectNoPageIssues = trackPageIssues(page);
  await loadPuzzle(page, '/?noOnboarding=true');

  // Progress from the day each was the daily.
  const token = await sessionToken(page);
  for (const [haikuId, progress] of [['7', { moves: 3, solved: false }], ['8', { moves: 9, solved: true }]] as const) {
    const response = await page.request.put(`/api/haikudles/${haikuId}`, {
      headers: { authorization: `Bearer ${token}` },
      data: { haikudle: progress },
    });
    expect(response.status()).toBe(200);
  }

  for (const haikuId of ['7', '8']) {
    await page.goto(`/${haikuId}?noOnboarding=true`);
    await expectSolvedHaiku(page, haikuId);
  }

  await pauseAtEnd(page);
  await expectNoPageIssues();
});

test('a previous daily haiku picked from the side panel shows solved', async ({ page }) => {
  const expectNoPageIssues = trackPageIssues(page);

  // Viewing it lists it in the side panel.
  const viewed = savedToUser(page);
  await page.goto('/7?noOnboarding=true');
  await viewed;
  await loadPuzzle(page, '/?noOnboarding=true');

  await page.locator('.open-side-panel-icon').first().click();
  await page.locator('.side-panel-body a[href="/7"]').first().click();
  await expect(page).toHaveURL(/\/7$/);
  await expectSolvedHaiku(page, '7');

  await pauseAtEnd(page);
  await expectNoPageIssues();
});

test('a haiku the user generated shows solved, also to others', async ({ browser, page }) => {
  const expectNoPageIssues = trackPageIssues(page);
  await loadPuzzle(page, '/?noOnboarding=true');

  const input = page.locator('.haiku-theme-input textarea');
  await input.fill('a quiet pond');
  await input.press('Enter');
  await expect(page).toHaveURL(/\/\w{6,}$/, { timeout: 30_000 });
  await expectSolvedPuzzle(page);

  const other = await (await browser.newContext()).newPage();
  const expectNoOtherIssues = trackPageIssues(other);
  await other.goto(`${new URL(page.url()).pathname}?noOnboarding=true`);
  await expectSolvedPuzzle(other);

  await pauseAtEnd(other);
  await expectNoPageIssues();
  await expectNoOtherIssues();
});
