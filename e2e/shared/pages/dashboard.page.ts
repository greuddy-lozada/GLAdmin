import { BasePage } from './base.page';

export class DashboardPage extends BasePage {
  url = '/dashboard';

  async waitForLoad(): Promise<void> {
    await this.byRole('heading', 'Dashboard').waitFor({ state: 'visible' });
  }
}
