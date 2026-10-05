import { expect, Page } from '@playwright/test';
import { hashCode, normalizeWord } from '@desmat/utils';

export type Puzzle = {
  id: string,
  // Hashed per word, as the app checks it.
  solution: number[][],
  words: { [id: string]: string },
};

export type Slot = { id: string, line: number, index: number };

export const tiles = '[data-word-id] > div';
export const dragPreview = '[class*="z-[9999]"]';

export async function loadPuzzle(page: Page, path = '/?mode=haikudle&noOnboarding=true'): Promise<Puzzle> {
  const loaded = page.waitForResponse((response) =>
    response.request().method() === 'GET' && new URL(response.url()).pathname.startsWith('/api/haikudles')
  );
  await page.goto(path);
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

export async function readBoard(page: Page): Promise<Slot[]> {
  return page.getByTestId('haikudle-puzzle').locator('[data-word-id]').evaluateAll((elements) =>
    elements.map((element) => {
      const { wordId, lineNumber, wordNumber } = (element as HTMLElement).dataset;
      return { id: wordId!, line: Number(lineNumber), index: Number(wordNumber) };
    })
  );
}

export function wordHash(puzzle: Puzzle, id: string) {
  return hashCode(normalizeWord(puzzle.words[id]));
}

export function isCorrect(puzzle: Puzzle, slot: Slot) {
  return wordHash(puzzle, slot.id) == puzzle.solution[slot.line][slot.index];
}

export async function wrongSlots(page: Page, puzzle: Puzzle) {
  return (await readBoard(page)).filter((slot) => !isCorrect(puzzle, slot));
}

// Tiles only carry a transform while a drag, swap or hint animates.
export async function waitForSettled(page: Page) {
  await expect.poll(() => page.locator(tiles).evaluateAll((elements) =>
    elements.filter((element) => getComputedStyle(element).transform !== 'none').length
  )).toBe(0);
  await expect(page.locator(dragPreview)).toHaveCount(0);
}

export async function center(page: Page, wordId: string) {
  const box = await page.locator(`[data-word-id="${wordId}"]`).boundingBox();
  expect(box, `word ${wordId} has no box`).toBeTruthy();
  return { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
}

// Left of the puzzle, level with the word: no word under the pointer.
export async function besidePuzzle(page: Page, wordId: string) {
  const puzzleBox = await page.getByTestId('haikudle-puzzle').boundingBox();
  const { y } = await center(page, wordId);
  return { x: puzzleBox!.x - 30, y };
}

export async function startDrag(page: Page, wordId: string) {
  const from = await center(page, wordId);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  return from;
}

export async function drag(page: Page, fromId: string, to: { x: number, y: number }) {
  await startDrag(page, fromId);
  await page.mouse.move(to.x, to.y, { steps: 10 });
  await page.mouse.up();
}

export function trackSaves(page: Page, puzzle: Puzzle) {
  const saves: any[] = [];
  page.on('request', (request) => {
    if (request.method() === 'PUT' && new URL(request.url()).pathname === `/api/haikudles/${puzzle.id}`) {
      saves.push(request.postDataJSON().haikudle);
    }
  });
  return saves;
}

export async function swapWords(page: Page, puzzle: Puzzle, fromId: string, toId: string) {
  const saved = page.waitForResponse((response) =>
    response.request().method() === 'PUT' && new URL(response.url()).pathname === `/api/haikudles/${puzzle.id}`
  );
  await drag(page, fromId, await center(page, toId));
  const response = await saved;
  expect(response.status()).toBe(200);
  await waitForSettled(page);
  return response.request().postDataJSON().haikudle;
}

export async function backgroundBlur(page: Page) {
  const filter = await page.locator('.bgImage-container').first().evaluate((element) => (element as HTMLElement).style.filter);
  return Number(filter.match(/blur\(([\d.]+)px\)/)?.[1]);
}

export async function titleOpacity(page: Page) {
  return page.getByTestId('haikudle-puzzle').locator('.poem-title').evaluate((element) =>
    getComputedStyle(element.closest('.transition-opacity')!).opacity
  );
}

export async function tileOpacity(page: Page, wordId: string) {
  return page.locator(`[data-word-id="${wordId}"] > div`).evaluate((element) => getComputedStyle(element).opacity);
}

// Samples every frame: a hint lasts under a second.
export async function anyTileMovedWithin(page: Page, ms: number) {
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

// Brings the right word into each wrong slot. Returns the number of moves.
export async function solvePuzzle(page: Page, puzzle: Puzzle) {
  let moves = 0;
  for (let wrong = await wrongSlots(page, puzzle); wrong.length; wrong = await wrongSlots(page, puzzle)) {
    const [slot] = wrong;
    const source = wrong.find((other) => other.id != slot.id && wordHash(puzzle, other.id) == puzzle.solution[slot.line][slot.index]);
    expect(source, `no word for slot ${slot.line}:${slot.index}`).toBeTruthy();
    await swapWords(page, puzzle, source!.id, slot.id);
    moves++;
  }
  return moves;
}
