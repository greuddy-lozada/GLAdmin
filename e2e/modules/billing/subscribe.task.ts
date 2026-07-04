import { AbstractTask } from '../../shared/tasks/base.task';
import type { Page } from '@playwright/test';
import { BillingPage } from './billing.page';
import { SlideFormComponent } from '../../shared/components/slide-form.component';

export class SubscribeTask extends AbstractTask {
  private readonly billingPage: BillingPage;
  private readonly form: SlideFormComponent;

  constructor(page: Page) {
    super(page);
    this.billingPage = new BillingPage(page);
    this.form = new SlideFormComponent(page);
  }

  async selectPlan(): Promise<void> {
    await this.billingPage.waitForLoad();
  }

  async openPagoMovilForm(): Promise<void> {
    await this.billingPage.clickPayWithPagoMovil('Starter');
    await this.form.waitForOpen();
  }

  async openCashForm(): Promise<void> {
    await this.billingPage.clickPayWithCash('Starter');
    await this.form.waitForOpen();
  }

  async execute(): Promise<void> {
    // Template method
  }

  async validate(exists: boolean): Promise<void> {
    if (!exists) throw new Error('Plan not found');
  }
}
