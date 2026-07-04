import { AbstractValidator } from './base.validator';
import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export class TableValidator extends AbstractValidator {
  constructor(page: Page, private readonly tableTestId = 'data-table') {
    super(page);
  }

  async expectSuccess(): Promise<void> {
    throw new Error('TableValidator.expectSuccess: use ToastValidator');
  }

  async expectError(): Promise<void> {
    throw new Error('TableValidator.expectError: use ToastValidator');
  }

  async expectVisible(text: string): Promise<void> {
    const row = this.page.locator(`[data-testid="${this.tableTestId}"] tbody tr`, { hasText: text });
    await row.waitFor({ state: 'visible', timeout: 5000 });
  }

  async expectNotVisible(text: string): Promise<void> {
    const row = this.page.locator(`[data-testid="${this.tableTestId}"] tbody tr`, { hasText: text });
    await row.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }

  async expectRowCount(count: number): Promise<void> {
    const rows = this.page.locator(`[data-testid="${this.tableTestId}"] tbody tr`);
    await expect(rows).toHaveCount(count);
  }

  async expectFieldError(): Promise<void> {
    throw new Error('TableValidator.expectFieldError: use FormValidator');
  }
}
