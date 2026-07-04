import type { Page } from '@playwright/test';

export abstract class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  abstract url: string;

  async navigate(): Promise<void> {
    await this.page.goto(this.url);
    await this.waitForLoad();
  }

  abstract waitForLoad(): Promise<void>;

  protected locator(selector: string) {
    return this.page.locator(selector);
  }

  protected byTestId(id: string) {
    return this.page.locator(`[data-testid="${id}"]`);
  }

  protected byRole(role: string, name?: string) {
    return this.page.getByRole(role as never, name ? { name } : {});
  }

  protected byLabel(text: string) {
    return this.page.getByLabel(text);
  }

  protected byPlaceholder(text: string) {
    return this.page.getByPlaceholder(text);
  }

  protected byText(text: string) {
    return this.page.getByText(text);
  }
}
