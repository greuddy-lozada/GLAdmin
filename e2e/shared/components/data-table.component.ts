import type { Page, Locator } from '@playwright/test';

export class DataTableComponent {
  readonly root: Locator;

  constructor(page: Page, testId = 'data-table') {
    this.root = page.locator(`[data-testid="${testId}"]`);
  }

  async waitForVisible(): Promise<void> {
    await this.root.waitFor({ state: 'visible' });
  }

  async getRowCount(): Promise<number> {
    return this.root.locator('tbody tr').count();
  }

  async hasRowWithText(text: string): Promise<boolean> {
    return this.root.locator('tbody').getByText(text).isVisible();
  }

  async search(query: string): Promise<void> {
    await this.root.locator('[data-testid="search-input"]').fill(query);
  }

  async clickRowAction(rowText: string, action: 'edit' | 'delete'): Promise<void> {
    const row = this.root.locator('tbody tr', { hasText: rowText });
    await row.locator(`[data-testid="${action}-btn"]`).click();
  }

  async clickCreate(): Promise<void> {
    await this.root.locator('[data-testid="create-btn"]').click();
  }
}
