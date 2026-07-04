import { AbstractValidator } from '../../shared/validators/base.validator';
import { ToastValidator } from '../../shared/validators/toast.validator';
import { FormValidator } from '../../shared/validators/form.validator';
import type { Page } from '@playwright/test';

export class BillingValidator extends AbstractValidator {
  private readonly toast: ToastValidator;
  private readonly form: FormValidator;

  constructor(page: Page) {
    super(page);
    this.toast = new ToastValidator(page);
    this.form = new FormValidator(page);
  }

  async expectSuccess(message?: string): Promise<void> {
    await this.toast.expectSuccess(message);
  }

  async expectError(message?: string): Promise<void> {
    await this.form.expectError(message);
  }

  async expectVisible(): Promise<void> {
    throw new Error('Use toast/form instead');
  }

  async expectNotVisible(): Promise<void> {
    throw new Error('Use toast/form instead');
  }

  async expectFieldError(field: string, message: string): Promise<void> {
    await this.form.expectFieldError(field, message);
  }
}
