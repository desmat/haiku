import { expect, test } from '@playwright/test';
import { hashCode, normalizeWord } from '@desmat/utils';
import { pauseAtEnd, trackPageIssues } from './helpers';
import {
  tiles,
  dragPreview,
  loadPuzzle,
  readBoard,
  wordHash,
  isCorrect,
  wrongSlots,
  waitForSettled,
  center,
  besidePuzzle,
  startDrag,
  drag,
  trackSaves,
  swapWords,
  backgroundBlur,
  titleOpacity,
  tileOpacity,
  anyTileMovedWithin,
} from './puzzle-helpers';

test('a new puzzle starts with only its first word in place', async ({ page }) => {
  const expectNoPageIssues = trackPageIssues(page);
  const puzzle = await loadPuzzle(page);

  const board = await readBoard(page);
  expect(board.filter((slot) => isCorrect(puzzle, slot))).toEqual([{ id: board[0].id, line: 0, index: 0 }]);

  // The memory store seeds haikus 1 to 8. Several repeat a word.
  // 7 and 8 are previous dailies: shown solved, their poem unhashed.
  const token = await page.evaluate(() => localStorage.getItem('session'));
  for (const haikuId of ['1', '2', '3', '4', '5', '6']) {
    const response = await page.request.get(`/api/haikudles/${haikuId}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(response.status()).toBe(200);
    const { haikudle } = await response.json();

    const inPlace = haikudle.inProgress.flatMap((line: any[], lineNumber: number) => line
      .filter((word: any, wordNumber: number) => hashCode(normalizeWord(word.word)) == haikudle.haiku.poem[lineNumber][wordNumber])
      .map((word: any) => word.word));
    expect(inPlace, `haiku ${haikuId}`).toEqual([haikudle.inProgress[0][0].word]);
  }

  await pauseAtEnd(page);
  await expectNoPageIssues();
});

test('the background carries over from the loading page and covers the screen', async ({ page }) => {
  const expectNoPageIssues = trackPageIssues(page);
  await page.addInitScript(() => {
    const w = window as any;
    w.__backgrounds = [];
    let count = 0;
    const tick = () => {
      const background = document.querySelector('.bgImage-container') as any;
      if (background) {
        background.__id ??= ++count;
        const rect = background.getBoundingClientRect();
        w.__backgrounds.push({
          id: background.__id,
          blur: parseFloat(getComputedStyle(background).filter.match(/blur\(([\d.]+)px\)/)?.[1] || '0'),
          covers: rect.top <= 0 && rect.left <= 0 && rect.bottom >= innerHeight && rect.right >= innerWidth,
          puzzle: !!document.querySelector('[data-word-id]'),
        });
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await loadPuzzle(page);
  await page.waitForTimeout(1000);

  const samples: { id: number, blur: number, covers: boolean, puzzle: boolean }[] =
    await page.evaluate(() => (window as any).__backgrounds);
  const blurs = samples.map((sample) => sample.blur);
  const puzzleBlur = blurs.at(-1)!;
  const easing = blurs.filter((blur) => blur < 40 && blur > puzzleBlur);

  expect(samples.some((sample) => !sample.puzzle), 'should start on the loading page').toBe(true);
  expect(new Set(samples.map((sample) => sample.id)).size, 'background element should carry over').toBe(1);
  expect(puzzleBlur).toBeGreaterThan(0);
  expect(easing.length, 'blur should ease from the loading page to the puzzle').toBeGreaterThanOrEqual(3);
  expect(samples.filter((sample) => !sample.covers), 'background should cover the screen').toEqual([]);

  await pauseAtEnd(page);
  await expectNoPageIssues();
});

test('dragging a word onto another swaps them and saves the move', async ({ page }) => {
  const expectNoPageIssues = trackPageIssues(page);
  const puzzle = await loadPuzzle(page);

  const [a, b] = await wrongSlots(page, puzzle);
  const saved = await swapWords(page, puzzle, a.id, b.id);

  const board = await readBoard(page);
  expect(board.find((slot) => slot.id == a.id)).toEqual({ ...b, id: a.id });
  expect(board.find((slot) => slot.id == b.id)).toEqual({ ...a, id: b.id });

  expect(saved.moves).toBe(1);
  expect(saved.solved).toBe(false);
  expect(saved.inProgress[b.line][b.index].id).toBe(a.id);
  expect(saved.inProgress[a.line][a.index].id).toBe(b.id);

  await pauseAtEnd(page);
  await expectNoPageIssues();
});

test('hovering a word while dragging previews the swap, and leaving it cancels the preview', async ({ page }) => {
  const expectNoPageIssues = trackPageIssues(page);
  const puzzle = await loadPuzzle(page);
  const saves = trackSaves(page, puzzle);
  const [a, b] = await wrongSlots(page, puzzle);

  await startDrag(page, a.id);
  const over = await center(page, b.id);
  await page.mouse.move(over.x, over.y, { steps: 10 });

  await expect(page.locator(dragPreview)).toHaveCount(1);
  await expect(page.locator(dragPreview)).toContainText(puzzle.words[a.id]);
  await expect(page.locator(`[data-word-id="${a.id}"]`)).toHaveCSS('visibility', 'hidden');
  // The hovered word fades and slides toward the dragged word's slot.
  await expect.poll(() => tileOpacity(page, b.id)).toBe('0.2');

  const away = await besidePuzzle(page, a.id);
  await page.mouse.move(away.x, away.y, { steps: 10 });
  await expect.poll(() => tileOpacity(page, b.id)).toBe('1');

  await page.mouse.up();
  await waitForSettled(page);
  await expect(page.locator(`[data-word-id="${a.id}"]`)).toHaveCSS('visibility', 'visible');
  expect(await readBoard(page)).toEqual(expect.arrayContaining([a, b]));
  expect(saves).toEqual([]);

  await pauseAtEnd(page);
  await expectNoPageIssues();
});

test('dropping a word away from the others returns it to its slot', async ({ page }) => {
  const expectNoPageIssues = trackPageIssues(page);
  const puzzle = await loadPuzzle(page);
  const saves = trackSaves(page, puzzle);
  const before = await readBoard(page);
  const [a] = await wrongSlots(page, puzzle);

  await drag(page, a.id, await besidePuzzle(page, a.id));

  await waitForSettled(page);
  expect(await readBoard(page)).toEqual(before);
  await expect(page.locator(`[data-word-id="${a.id}"]`)).toHaveCSS('visibility', 'visible');
  expect(saves).toEqual([]);

  await pauseAtEnd(page);
  await expectNoPageIssues();
});

test('a press without moving does not start a drag', async ({ page }) => {
  const expectNoPageIssues = trackPageIssues(page);
  const puzzle = await loadPuzzle(page);
  const saves = trackSaves(page, puzzle);
  const before = await readBoard(page);
  const [a] = await wrongSlots(page, puzzle);

  const from = await startDrag(page, a.id);
  // Drags start past 4px.
  await page.mouse.move(from.x + 3, from.y, { steps: 3 });
  await expect(page.locator(dragPreview)).toHaveCount(0);
  await page.mouse.up();

  await waitForSettled(page);
  expect(await readBoard(page)).toEqual(before);
  expect(saves).toEqual([]);

  await pauseAtEnd(page);
  await expectNoPageIssues();
});

test('correct words can neither be dragged nor swapped with', async ({ page }) => {
  const expectNoPageIssues = trackPageIssues(page);
  const puzzle = await loadPuzzle(page);
  const saves = trackSaves(page, puzzle);
  const before = await readBoard(page);

  // The first word always starts in place.
  const first = before.find((slot) => slot.line == 0 && slot.index == 0)!;
  expect(isCorrect(puzzle, first)).toBe(true);
  const [a] = await wrongSlots(page, puzzle);

  await drag(page, first.id, await center(page, a.id));
  await expect(page.locator(dragPreview)).toHaveCount(0);

  await drag(page, a.id, await center(page, first.id));
  await waitForSettled(page);

  expect(await readBoard(page)).toEqual(before);
  expect(saves).toEqual([]);

  await pauseAtEnd(page);
  await expectNoPageIssues();
});

test('solving the puzzle locks every word, clears the blur and reveals the title', async ({ page }) => {
  const expectNoPageIssues = trackPageIssues(page);
  const puzzle = await loadPuzzle(page);

  expect(await backgroundBlur(page)).toBeGreaterThan(0);
  expect(await titleOpacity(page)).toBe('0');
  // Solving saves the haiku to the user's. Ending mid-request logs a server error for the next test.
  const savedToUser = page.waitForResponse((response) =>
    response.request().method() === 'POST' && /^\/api\/user\/[^/]+\/haikus$/.test(new URL(response.url()).pathname)
  );

  let moves = 0;
  let blur = await backgroundBlur(page);
  let saved: any;

  for (let wrong = await wrongSlots(page, puzzle); wrong.length; wrong = await wrongSlots(page, puzzle)) {
    // Bring the word that belongs in the first wrong slot.
    const [slot] = wrong;
    const source = wrong.find((other) => other.id != slot.id && wordHash(puzzle, other.id) == puzzle.solution[slot.line][slot.index]);
    expect(source, `no word for slot ${slot.line}:${slot.index}`).toBeTruthy();

    saved = await swapWords(page, puzzle, source!.id, slot.id);
    moves++;
    expect(saved.moves).toBe(moves);

    const nextBlur = await backgroundBlur(page);
    expect(nextBlur).toBeLessThanOrEqual(blur);
    blur = nextBlur;
  }

  expect(saved.solved).toBe(true);
  expect(blur).toBe(0);
  await expect(page.locator(`${tiles}.cursor-grab`)).toHaveCount(0);
  await expect.poll(() => titleOpacity(page)).toBe('1');
  await expect(page.getByText(`Solved in ${moves} move${moves > 1 ? 's' : ''}!`)).toBeVisible();
  await savedToUser;

  await pauseAtEnd(page);
  await expectNoPageIssues();
});

test('progress carries over to a new visit', async ({ context, page }) => {
  const expectNoPageIssues = trackPageIssues(page);
  const puzzle = await loadPuzzle(page);

  const [a, b] = await wrongSlots(page, puzzle);
  await swapWords(page, puzzle, a.id, b.id);
  const board = await readBoard(page);

  // A new tab shares the session. A reload would abort requests still in flight.
  const revisit = await context.newPage();
  const expectNoRevisitIssues = trackPageIssues(revisit);
  const revisited = await loadPuzzle(revisit);
  expect(await readBoard(revisit)).toEqual(board);

  const [c, d] = await wrongSlots(revisit, revisited);
  const saved = await swapWords(revisit, revisited, c.id, d.id);
  expect(saved.moves).toBe(2);

  await pauseAtEnd(revisit);
  await expectNoPageIssues();
  await expectNoRevisitIssues();
});

test('an idle puzzle hints at dragging a word, until the player drags one', async ({ page }) => {
  const expectNoPageIssues = trackPageIssues(page);
  const puzzle = await loadPuzzle(page);
  const saves = trackSaves(page, puzzle);

  // First hint after 5s idle.
  expect(await anyTileMovedWithin(page, 8_000)).toBe(true);
  await waitForSettled(page);

  const [a] = await wrongSlots(page, puzzle);
  await drag(page, a.id, await besidePuzzle(page, a.id));
  await waitForSettled(page);

  // Repeat hints come every 2s; a drag stops them.
  expect(await anyTileMovedWithin(page, 6_000)).toBe(false);
  expect(saves).toEqual([]);

  await pauseAtEnd(page);
  await expectNoPageIssues();
});
