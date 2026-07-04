import { BasePage } from '../../shared/pages/base.page';
import type { Locator } from '@playwright/test';

export class PosPage extends BasePage {
  url = '/pos';

  readonly productSearch: Locator = this.byPlaceholder('Buscar producto');
  readonly cart: Locator = this.locator('[data-testid="cart"]');
  readonly payButton: Locator = this.page.getByRole('button', { name: /cobrar|pay/i });

  async waitForLoad(): Promise<void> {
    await this.productSearch.waitFor({ state: 'visible', timeout: 10000 });
  }

  async searchProduct(query: string): Promise<void> {
    await this.productSearch.fill(query);
  }

  async selectProduct(productName: string): Promise<void> {
    await this.page.locator('[data-testid="product-result"]', { hasText: productName }).click();
  }
}
