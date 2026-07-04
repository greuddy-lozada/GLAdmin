import { AbstractValidator } from './base.validator';

export class ToastValidator extends AbstractValidator {
  async expectSuccess(message?: string): Promise<void> {
    const toast = this.page.locator('[data-sonner-toast]');
    await toast.waitFor({ state: 'visible', timeout: 5000 });
    if (message) await toast.filter({ hasText: message }).waitFor({ state: 'visible', timeout: 3000 });
  }

  async expectError(message?: string): Promise<void> {
    const toast = this.page.locator('[data-sonner-toast][data-type="error"]');
    await toast.waitFor({ state: 'visible', timeout: 5000 });
    if (message) await toast.filter({ hasText: message }).waitFor({ state: 'visible', timeout: 3000 });
  }

  async expectVisible(): Promise<void> {
    throw new Error('ToastValidator.expectVisible: use TableValidator');
  }

  async expectNotVisible(): Promise<void> {
    throw new Error('ToastValidator.expectNotVisible: use TableValidator');
  }

  async expectFieldError(): Promise<void> {
    throw new Error('ToastValidator.expectFieldError: use FormValidator');
  }
}
