import { expect, Page, test } from '@playwright/test';

type Sample = {
  bgImage: string,
  blur: number,
  poem?: string,
  poemOpacity: number,
};

// Viewed haikus are listed in the side panel.
async function view(page: Page, id: string) {
  const viewed = page.waitForResponse((response) =>
    response.url().includes('/haikus') && response.request().method() == 'POST'
  );
  await page.goto(`/${id}?noOnboarding=true`);
  await expect(page.locator('.poem-line-input').first()).toBeVisible();
  await viewed;
}

async function sampleChange(page: Page, trigger: () => Promise<void>): Promise<Sample[]> {
  await page.evaluate(() => {
    const w = window as any;
    w.__samples = [];
    w.__sampling = true;
    const tick = () => {
      const background = document.querySelector('.bgImage-container');
      const style = background && getComputedStyle(background);
      const line = document.querySelector('.poem-line-input');
      const poem = line?.closest('.z-20');
      w.__samples.push({
        bgImage: style?.backgroundImage || '',
        blur: parseFloat(style?.filter.match(/blur\(([\d.]+)px\)/)?.[1] || '0'),
        poem: line?.textContent || undefined,
        poemOpacity: poem ? parseFloat(getComputedStyle(poem).opacity) : 0,
      });
      if (w.__sampling) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  await trigger();
  await expect(page).toHaveURL(/\/1$/);
  await page.waitForTimeout(1500);

  return page.evaluate(() => {
    const w = window as any;
    w.__sampling = false;
    return w.__samples;
  });
}

const distinct = (values: number[]) => new Set(values.map((value) => value.toFixed(2))).size;

test('changing haiku fades the poem out, then reveals the next one', async ({ page }) => {
  await view(page, '1');
  await view(page, '2');
  // A reload would drop this.
  await page.evaluate(() => (window as any).__samePage = true);

  await page.locator('.open-side-panel-icon').first().click();
  const samples = await sampleChange(page, () =>
    page.locator('.side-panel-body a[href="/1"]').first().click()
  );

  const oldPoem = samples[0].poem;
  const leaving = samples.filter((sample) => sample.poem == oldPoem);
  const arriving = samples.slice(leaving.length);
  const swap = samples.findIndex((sample) => sample.bgImage != samples[0].bgImage);

  expect(distinct(leaving.map((sample) => sample.poemOpacity)), 'old poem should fade out').toBeGreaterThanOrEqual(3);
  expect(leaving.at(-1)?.poemOpacity).toBeLessThan(0.1);

  expect(swap, 'background image should change').toBeGreaterThan(0);
  expect(samples[swap].blur, 'next image should arrive blurred, then sharpen').toBeGreaterThan(20);
  expect(samples.at(-1)?.blur).toBe(0);

  expect(arriving.length).toBeGreaterThan(0);
  expect(arriving[0].poem).not.toEqual(oldPoem);
  expect(arriving[0].poemOpacity, 'next poem should fade in').toBeLessThan(0.2);
  expect(distinct(arriving.map((sample) => sample.poemOpacity)), 'next poem should fade in').toBeGreaterThanOrEqual(3);
  expect(arriving.at(-1)?.poemOpacity).toBe(1);

  expect(await page.evaluate(() => (window as any).__samePage)).toBe(true);
});
