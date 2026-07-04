import { AbstractTask } from '../../shared/tasks/base.task';
import type { Page } from '@playwright/test';

export class PaymentReviewTask extends AbstractTask {
  constructor(page: Page) {
    super(page);
  }

  async execute(): Promise<void> {
    // Template method
  }

  async validate(exists: boolean): Promise<void> {
    if (!exists) throw new Error('Payment not found');
  }
}
