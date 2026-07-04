import { BasePage } from '../../shared/pages/base.page';
import { DataTableComponent } from '../../shared/components/data-table.component';

export class ProductsPage extends BasePage {
  url = '/products';

  readonly table = new DataTableComponent(this.page, 'products-table');

  async waitForLoad(): Promise<void> {
    await this.table.waitForVisible();
  }
}
