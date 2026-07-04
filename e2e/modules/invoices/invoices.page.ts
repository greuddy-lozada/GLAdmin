import { BasePage } from '../../shared/pages/base.page';
import type { Locator } from '@playwright/test';

export class InvoicesPage extends BasePage {
  url = '/pos';

  readonly productSearch: Locator = this.byPlaceholder('Buscar producto');
  readonly payButton: Locator = this.page.getByRole('button', { name: /cobrar|pay/i });

  async waitForLoad(): Promise<void> {
    await this.productSearch.waitFor({ state: 'visible', timeout: 10000 });
  }

  async searchAndSelectProduct(name: string): Promise<void> {
    await this.productSearch.fill(name);
    await this.page.locator('[data-testid="product-result"]', { hasText: name }).click();
  }
}
