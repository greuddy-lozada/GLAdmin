import { BasePage } from '../../shared/pages/base.page';
import { DataTableComponent } from '../../shared/components/data-table.component';

export class AdminPage extends BasePage {
  url = '/admin';

  readonly table = new DataTableComponent(this.page, 'admin-table');

  async waitForLoad(): Promise<void> {
    await this.byText('Organizations').first().waitFor({ state: 'visible', timeout: 10000 });
  }
}
