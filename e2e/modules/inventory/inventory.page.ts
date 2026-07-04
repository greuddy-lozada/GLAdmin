import { BasePage } from '../../shared/pages/base.page';
import { DataTableComponent } from '../../shared/components/data-table.component';

export class InventoryPage extends BasePage {
  url = '/stocks';

  readonly table = new DataTableComponent(this.page, 'stocks-table');

  async waitForLoad(): Promise<void> {
    await this.table.waitForVisible();
  }
}
