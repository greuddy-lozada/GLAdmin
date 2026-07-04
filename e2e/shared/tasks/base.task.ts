import type { Page } from '@playwright/test';

export abstract class AbstractTask {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  abstract execute(data: unknown): Promise<void>;
  abstract validate(exists: boolean): Promise<void>;
}
