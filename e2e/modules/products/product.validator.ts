import { AbstractValidator } from '../../shared/validators/base.validator';
import { ToastValidator } from '../../shared/validators/toast.validator';
import { TableValidator } from '../../shared/validators/table.validator';
import { FormValidator } from '../../shared/validators/form.validator';
import type { Page } from '@playwright/test';

export class ProductValidator extends AbstractValidator {
  private readonly toast: ToastValidator;
  private readonly table: TableValidator;
  private readonly form: FormValidator;

  constructor(page: Page) {
    super(page);
    this.toast = new ToastValidator(page);
    this.table = new TableValidator(page, 'products-table');
    this.form = new FormValidator(page);
  }

  async expectSuccess(message?: string): Promise<void> {
    await this.toast.expectSuccess(message);
  }

  async expectError(message?: string): Promise<void> {
    await this.form.expectError(message);
  }

  async expectVisible(text: string): Promise<void> {
    await this.table.expectVisible(text);
  }

  async expectNotVisible(text: string): Promise<void> {
    await this.table.expectNotVisible(text);
  }

  async expectFieldError(field: string, message: string): Promise<void> {
    await this.form.expectFieldError(field, message);
  }
}
