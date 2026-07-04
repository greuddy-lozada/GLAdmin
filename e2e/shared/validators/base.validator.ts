import type { Page } from '@playwright/test';

export abstract class AbstractValidator {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  abstract expectSuccess(message?: string): Promise<void>;
  abstract expectError(message?: string): Promise<void>;
  abstract expectVisible(selector: string, text?: string): Promise<void>;
  abstract expectNotVisible(selector: string, text?: string): Promise<void>;
  abstract expectFieldError(field: string, message: string): Promise<void>;
}
