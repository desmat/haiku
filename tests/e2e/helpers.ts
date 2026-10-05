import { expect, Page } from '@playwright/test';
import { readFile } from 'fs/promises';

const webServerLogPaths = ['test-results/webserver.log', 'test-results/webserver-haikudle.log'];

export function trackPageIssues(page: Page) {
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

    const webServerLog = (await Promise.all(webServerLogPaths.map((path) => readFile(path, 'utf8').catch(() => '')))).join('\n');
    const serverErrorLines = webServerLog
      .split('\n')
      .filter((line) => line.includes('⨯'));

    expect(serverErrorLines, 'unexpected server-side errors in the Next dev-server log').toEqual([]);
  };
}

export async function pauseAtEnd(page: Page) {
  const endPauseMs = Number(process.env.PLAYWRIGHT_END_PAUSE_MS || 0);
  if (endPauseMs > 0) {
    await page.waitForTimeout(endPauseMs);
  }
}
