import { expect, Page, test } from '@playwright/test';

type Sample = {
  poemFontSize: number,
  lineHeight: number,
  signatureFontSize: number,
  signatureOpacity: number,
  navOpacity: number,
  bottomLinks: number,
};

// Samples every frame while `trigger` switches modes.
async function sampleSwitch(page: Page, trigger: () => Promise<void>): Promise<Sample[]> {
  await page.evaluate(() => {
    const w = window as any;
    w.__samples = [];
    w.__sampling = true;
    const px = (element: Element | null | undefined, property: string) =>
      element ? parseFloat(getComputedStyle(element).getPropertyValue(property)) : NaN;
    const tick = () => {
      const line = document.querySelector('.poem-line-input');
      const signature = document.querySelector('.poem-title')?.parentElement;
      const bottomLinks = document.querySelector('.nav-overlay .fixed.bottom-2 .mode-transition');
      w.__samples.push({
        poemFontSize: px(line?.closest('.flex-col'), 'font-size'),
        lineHeight: px(line, 'line-height'),
        signatureFontSize: px(signature, 'font-size'),
        signatureOpacity: px(signature, 'opacity'),
        navOpacity: px(bottomLinks, 'opacity'),
        bottomLinks: bottomLinks?.querySelectorAll('a').length || 0,
      });
      if (w.__sampling) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  await trigger();
  await page.waitForTimeout(1200);

  return page.evaluate(() => {
    const w = window as any;
    w.__sampling = false;
    return w.__samples;
  });
}

const distinct = (values: number[]) => new Set(values.map((value) => value.toFixed(2))).size;

// Eases from one value to another, without jumping or overshooting on the way.
function expectEases(values: number[], label: string, direction: 'up' | 'down') {
  const steps = values.slice(1).map((value, i) => value - values[i]);
  const wrongWay = steps.filter((step) => direction == 'up' ? step < -0.01 : step > 0.01);

  expect(wrongWay, `${label} should only go ${direction}`).toEqual([]);
  expect(distinct(values), `${label} should ease through intermediate values`).toBeGreaterThanOrEqual(5);
}

function expectFadesIn(samples: Sample[]) {
  const signatureSizes = samples.map((sample) => sample.signatureFontSize);
  const signatureOpacities = samples.map((sample) => sample.signatureOpacity);

  expect(distinct(signatureSizes), 'signature should snap to its new size, not animate').toBeLessThanOrEqual(2);
  expect(Math.min(...signatureOpacities), 'signature should disappear right away').toBeLessThan(0.1);
  expect(signatureOpacities.at(-1)).toBe(1);
}

test('switching between haiku and showcase animates in place', async ({ page }) => {
  await page.goto('/?noOnboarding=true');
  await expect(page.locator('.poem-line-input').first()).toBeVisible();
  // A reload would drop this.
  await page.evaluate(() => (window as any).__samePage = true);

  const toShowcase = await sampleSwitch(page, () =>
    page.locator('[title="Click to switch to showcase mode"]').click()
  );

  await expect(page).toHaveURL(/mode=showcase/);
  expectEases(toShowcase.map((sample) => sample.poemFontSize), 'poem font size', 'up');
  expectEases(toShowcase.map((sample) => sample.lineHeight), 'line height', 'up');
  expectEases(toShowcase.map((sample) => sample.navOpacity), 'nav opacity', 'down');
  expect(distinct(toShowcase.map((sample) => sample.bottomLinks)), 'bottom links should not change while fading out').toBe(1);
  expect(toShowcase.at(-1)?.navOpacity).toBe(0);
  expectFadesIn(toShowcase);

  const toHaiku = await sampleSwitch(page, () => page.keyboard.press('Escape'));

  await expect(page).not.toHaveURL(/mode=/);
  expectEases(toHaiku.map((sample) => sample.poemFontSize), 'poem font size', 'down');
  expectEases(toHaiku.map((sample) => sample.lineHeight), 'line height', 'down');
  expectEases(toHaiku.map((sample) => sample.navOpacity), 'nav opacity', 'up');
  expect(toHaiku.at(-1)?.navOpacity).toBe(1);
  expectFadesIn(toHaiku);

  expect(await page.evaluate(() => (window as any).__samePage)).toBe(true);
});

// No admin runs here: admins edit, or with DAILY_HAIKU_PREVIEW switch to showcase, and load a random liked haiku from showcase.
function trackRandomLoads(page: Page) {
  const randomLoads: URLSearchParams[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    url.pathname == '/api/haikus' && url.searchParams.get('random') && randomLoads.push(url.searchParams);
  });
  return randomLoads;
}

test('a user clicking the poem switches to showcase and back', async ({ page }) => {
  const randomLoads = trackRandomLoads(page);
  await page.goto('/1?noOnboarding=true');
  await expect(page.locator('.poem-line-input').first()).toBeVisible();

  await page.locator('[title="Click to switch to showcase mode"]').click();
  await expect(page).toHaveURL(/mode=showcase/);

  await page.locator('[title="Click to switch to edit mode"]').click();
  await expect(page).not.toHaveURL(/mode=showcase/);
  await expect(page.locator('.poem-line-input').first()).toBeVisible();
  expect(randomLoads).toEqual([]);
});

for (const mode of ['haiku', 'showcase']) {
  test(`a user on an album clicking the poem loads a random haiku from the album, in ${mode} mode`, async ({ page }) => {
    const randomLoads = trackRandomLoads(page);
    await page.goto(`/1?noOnboarding=true&album=test${mode == 'showcase' ? '&mode=showcase' : ''}`);
    await expect(page.locator('.poem-line-input').first()).toBeVisible();

    await page.locator('[title="Load a random haiku"]').click();
    await expect.poll(() => randomLoads.length).toBe(1);
    expect(randomLoads[0].get('album')).toBe('test');
    expect(randomLoads[0].get('liked')).toBeNull();
    expect(new URL(page.url()).searchParams.get('mode')).toBe(mode == 'showcase' ? 'showcase' : null);
  });
}
