import type { Page, Locator } from '@playwright/test';

export class SidebarComponent {
  private readonly root: Locator;

  constructor(page: Page) {
    this.root = page.locator('nav');
  }

  async navigateTo(label: string): Promise<void> {
    const link = this.root.locator('a', { hasText: label });
    await link.waitFor({ state: 'visible' });
    await link.click();
  }

  async isModuleVisible(label: string): Promise<boolean> {
    return this.root.locator('a', { hasText: label }).isVisible();
  }
}
