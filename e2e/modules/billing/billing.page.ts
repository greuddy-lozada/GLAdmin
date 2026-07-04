import { BasePage } from '../../shared/pages/base.page';
import type { Locator } from '@playwright/test';

export class BillingPage extends BasePage {
  url = '/billing';

  readonly planCards: Locator = this.page.locator('.grid > .rounded-xl');

  async waitForLoad(): Promise<void> {
    await this.planCards.first().waitFor({ state: 'visible' });
  }

  async clickPayWithPagoMovil(planName: string): Promise<void> {
    const card = this.page.locator('.grid > .rounded-xl', { hasText: planName });
    await card.locator('button', { hasText: /pago móvil/i }).click();
  }

  async clickPayWithCash(planName: string): Promise<void> {
    const card = this.page.locator('.grid > .rounded-xl', { hasText: planName });
    await card.locator('button', { hasText: /efectivo|cash/i }).click();
  }
}
