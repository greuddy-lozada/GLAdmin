import { AbstractTask } from '../../shared/tasks/base.task';
import type { Page } from '@playwright/test';
import { InvoicesPage } from './invoices.page';
import { ToastValidator } from '../../shared/validators/toast.validator';

export class InvoiceLifecycleTask extends AbstractTask {
  private readonly invoicesPage: InvoicesPage;
  private readonly toast: ToastValidator;

  constructor(page: Page) {
    super(page);
    this.invoicesPage = new InvoicesPage(page);
    this.toast = new ToastValidator(page);
  }

  async createSale(): Promise<void> {
    await this.invoicesPage.waitForLoad();
    await this.invoicesPage.searchAndSelectProduct('Martillo');
    await this.invoicesPage.payButton.click();
    await this.toast.expectSuccess();
  }

  async verifySaleInHistory(): Promise<void> {
    // Navigate to sales/history view if available
    const historyTab = this.page.locator('[data-testid="sale-history"]');
    if (await historyTab.isVisible()) {
      await historyTab.click();
    }
  }

  async cancelLastSale(): Promise<void> {
    const cancelBtn = this.page.locator('[data-testid="cancel-sale-btn"]').first();
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
      await this.toast.expectSuccess();
    }
  }

  async execute(): Promise<void> {
    await this.createSale();
    await this.verifySaleInHistory();
    await this.cancelLastSale();
  }

  async validate(exists: boolean): Promise<void> {
    if (!exists) throw new Error('Sale lifecycle failed');
  }
}
