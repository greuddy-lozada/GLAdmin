import type { Page, Locator } from '@playwright/test';

export class ConfirmDialogComponent {
  private readonly root: Locator;

  constructor(page: Page) {
    this.root = page.locator('[role="alertdialog"]');
  }

  async waitForOpen(): Promise<void> {
    await this.root.waitFor({ state: 'visible', timeout: 5000 });
  }

  async confirm(): Promise<void> {
    await this.waitForOpen();
    await this.root.locator('button', { hasText: /confirmar|sí|yes|confirm/i }).click();
  }

  async cancel(): Promise<void> {
    await this.waitForOpen();
    await this.root.locator('button', { hasText: /cancelar|cancel/i }).click();
  }
}
