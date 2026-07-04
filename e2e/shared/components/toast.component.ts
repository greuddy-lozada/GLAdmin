import type { Page } from '@playwright/test';

export class ToastComponent {
  constructor(private readonly page: Page) {}

  async expectSuccess(message?: string): Promise<void> {
    const toast = this.page.locator('[data-sonner-toast]');
    await toast.waitFor({ state: 'visible', timeout: 5000 });
    if (message) await toast.filter({ hasText: message }).waitFor({ state: 'visible', timeout: 3000 });
  }
}
