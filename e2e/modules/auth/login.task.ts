import { AbstractTask } from '../../shared/tasks/base.task';
import type { Page } from '@playwright/test';
import { LoginPage } from '../../shared/pages/login.page';

interface LoginData {
  email: string;
  password: string;
}

export class LoginTask extends AbstractTask {
  private readonly loginPage: LoginPage;

  constructor(page: Page) {
    super(page);
    this.loginPage = new LoginPage(page);
  }

  async execute(data: LoginData): Promise<void> {
    await this.loginPage.navigate();
    await this.loginPage.login(data.email, data.password);
    await this.loginPage.waitForDashboard();
  }

  async validate(exists: boolean): Promise<void> {
    if (!exists) throw new Error('Dashboard not visible after login');
  }
}
