import { AbstractTask } from '../../shared/tasks/base.task';
import type { Page } from '@playwright/test';
import { PosPage } from './pos.page';
import { PosValidator } from './pos.validator';

export class CheckoutTask extends AbstractTask {
  private readonly posPage: PosPage;
  private readonly validator: PosValidator;

  constructor(page: Page) {
    super(page);
    this.posPage = new PosPage(page);
    this.validator = new PosValidator(page);
  }

  async addProduct(productName: string): Promise<void> {
    await this.posPage.searchProduct(productName);
    await this.posPage.selectProduct(productName);
  }

  async completeCheckout(): Promise<void> {
    await this.posPage.payButton.click();
    await this.validator.expectSuccess();
  }

  async execute(): Promise<void> {
    // Template method
  }

  async validate(exists: boolean): Promise<void> {
    if (!exists) throw new Error('Checkout failed');
  }
}
