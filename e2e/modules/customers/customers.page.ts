import { BasePage } from '../../shared/pages/base.page';
import { DataTableComponent } from '../../shared/components/data-table.component';

export class CustomersPage extends BasePage {
  url = '/customers';

  readonly table = new DataTableComponent(this.page, 'customers-table');

  async waitForLoad(): Promise<void> {
    await this.table.waitForVisible();
  }
}
