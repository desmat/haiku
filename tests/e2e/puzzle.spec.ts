import { expect, Page, test } from '@playwright/test';
import { hashCode, normalizeWord } from '@desmat/utils';
import { pauseAtEnd, trackPageIssues } from './helpers';

type Puzzle = {
  id: string,
  // Hashed per word, as the app checks it.
  solution: number[][],
  words: { [id: string]: string },
};

type Slot = { id: string, line: number, index: number };

const tiles = '[data-word-id] > div';
const dragPreview = '[class*="z-[9999]"]';

async function loadPuzzle(page: Page): Promise<Puzzle> {
  const loaded = page.waitForResponse((response) =>
    response.request().method() === 'GET' && new URL(response.url()).pathname.startsWith('/api/haikudles')
  );
  await page.goto('/?mode=haikudle&noOnboarding=true');
  const data = await (await loaded).json();
  const haikudle = data.haikudle ?? data.haikudles[0];

  await expect(page.getByTestId('haikudle-puzzle').locator('[data-word-id]').first()).toBeVisible({ timeout: 30_000 });
  await waitForSettled(page);

  return {
    id: haikudle.id,
    solution: haikudle.haiku.poem,
    words: Object.fromEntries(haikudle.inProgress.flat().map((word: any) => [word.id, word.word])),
  };
}

async function readBoard(page: Page): Promise<Slot[]> {
  return page.getByTestId('haikudle-puzzle').locator('[data-word-id]').evaluateAll((elements) =>
    elements.map((element) => {
      const { wordId, lineNumber, wordNumber } = (element as HTMLElement).dataset;
      return { id: wordId!, line: Number(lineNumber), index: Number(wordNumber) };
    })
  );
}

function wordHash(puzzle: Puzzle, id: string) {
  return hashCode(normalizeWord(puzzle.words[id]));
}

function isCorrect(puzzle: Puzzle, slot: Slot) {
  return wordHash(puzzle, slot.id) == puzzle.solution[slot.line][slot.index];
}

async function wrongSlots(page: Page, puzzle: Puzzle) {
  return (await readBoard(page)).filter((slot) => !isCorrect(puzzle, slot));
}

// Tiles only carry a transform while a drag, swap or hint animates.
async function waitForSettled(page: Page) {
  await expect.poll(() => page.locator(tiles).evaluateAll((elements) =>
    elements.filter((element) => getComputedStyle(element).transform !== 'none').length
  )).toBe(0);
  await expect(page.locator(dragPreview)).toHaveCount(0);
}

async function center(page: Page, wordId: string) {
  const box = await page.locator(`[data-word-id="${wordId}"]`).boundingBox();
  expect(box, `word ${wordId} has no box`).toBeTruthy();
  return { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
}

// Left of the puzzle, level with the word: no word under the pointer.
async function besidePuzzle(page: Page, wordId: string) {
  const puzzleBox = await page.getByTestId('haikudle-puzzle').boundingBox();
  const { y } = await center(page, wordId);
  return { x: puzzleBox!.x - 30, y };
}

async function startDrag(page: Page, wordId: string) {
  const from = await center(page, wordId);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  return from;
}

async function drag(page: Page, fromId: string, to: { x: number, y: number }) {
  await startDrag(page, fromId);
  await page.mouse.move(to.x, to.y, { steps: 10 });
  await page.mouse.up();
}

function trackSaves(page: Page, puzzle: Puzzle) {
  const saves: any[] = [];
  page.on('request', (request) => {
    if (request.method() === 'PUT' && new URL(request.url()).pathname === `/api/haikudles/${puzzle.id}`) {
      saves.push(request.postDataJSON().haikudle);
    }
  });
  return saves;
}

async function swapWords(page: Page, puzzle: Puzzle, fromId: string, toId: string) {
  const saved = page.waitForResponse((response) =>
    response.request().method() === 'PUT' && new URL(response.url()).pathname === `/api/haikudles/${puzzle.id}`
  );
  await drag(page, fromId, await center(page, toId));
  const response = await saved;
  expect(response.status()).toBe(200);
  await waitForSettled(page);
  return response.request().postDataJSON().haikudle;
}

async function backgroundBlur(page: Page) {
  const filter = await page.locator('.bgImage-container').first().evaluate((element) => (element as HTMLElement).style.filter);
  return Number(filter.match(/blur\(([\d.]+)px\)/)?.[1]);
}

async function titleOpacity(page: Page) {
  return page.getByTestId('haikudle-puzzle').locator('.poem-title').evaluate((element) =>
    getComputedStyle(element.closest('.transition-opacity')!).opacity
  );
}

async function tileOpacity(page: Page, wordId: string) {
  return page.locator(`[data-word-id="${wordId}"] > div`).evaluate((element) => getComputedStyle(element).opacity);
}

// Samples every frame: a hint lasts under a second.
async function anyTileMovedWithin(page: Page, ms: number) {
  return page.evaluate(async ({ selector, ms }) => {
    const end = performance.now() + ms;
    while (performance.now() < end) {
      const moved = Array.from(document.querySelectorAll(selector))
        .some((element) => getComputedStyle(element).transform !== 'none');
      if (moved) return true;
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    return false;
  }, { selector: tiles, ms });
}

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
