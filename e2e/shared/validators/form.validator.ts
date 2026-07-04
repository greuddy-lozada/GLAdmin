import { AbstractValidator } from './base.validator';

export class FormValidator extends AbstractValidator {
  async expectSuccess(): Promise<void> {
    throw new Error('FormValidator.expectSuccess: use ToastValidator');
  }

  async expectError(message?: string): Promise<void> {
    const alert = this.page.locator('[role="alert"]:has(.text-destructive)');
    await alert.waitFor({ state: 'visible', timeout: 5000 });
    if (message) await alert.filter({ hasText: message }).waitFor({ state: 'visible', timeout: 3000 });
  }

  async expectVisible(): Promise<void> {
    throw new Error('FormValidator.expectVisible: use TableValidator');
  }

  async expectNotVisible(): Promise<void> {
    throw new Error('FormValidator.expectNotVisible: use TableValidator');
  }

  async expectFieldError(field: string, message: string): Promise<void> {
    const container = this.page.locator(`[data-testid="field-${field}"]`);
    const errorEl = container.locator('.text-destructive');
    await errorEl.waitFor({ state: 'visible', timeout: 3000 });
    await errorEl.filter({ hasText: message }).waitFor({ state: 'visible', timeout: 3000 });
  }
}
