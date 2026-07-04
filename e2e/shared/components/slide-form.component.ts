import type { Page, Locator } from '@playwright/test';

export class SlideFormComponent {
  private readonly root: Locator;

  constructor(page: Page) {
    this.root = page.locator('[role="dialog"]');
  }

  async waitForOpen(): Promise<void> {
    await this.root.waitFor({ state: 'visible', timeout: 5000 });
  }

  async waitForClose(): Promise<void> {
    await this.root.waitFor({ state: 'hidden', timeout: 5000 });
  }

  async fill(fieldName: string, value: string): Promise<void> {
    const input = this.root.locator(`[name="${fieldName}"]`);
    await input.waitFor({ state: 'visible' });
    await input.fill(value);
  }

  async submit(): Promise<void> {
    await this.root.locator('button[type="submit"]').click();
  }

  async close(): Promise<void> {
    await this.root.locator('[aria-label="Close"]').click();
    await this.waitForClose();
  }
}
