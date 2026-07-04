import { AbstractTask } from '../../shared/tasks/base.task';
import type { Page } from '@playwright/test';
import { LoginPage } from '../../shared/pages/login.page';

interface CashierCredentials {
  email: string;
  password: string;
}

export class RegistrationTask extends AbstractTask {
  private readonly loginPage: LoginPage;

  constructor(page: Page) {
    super(page);
    this.loginPage = new LoginPage(page);
  }

  async createCashierViaApi(): Promise<CashierCredentials> {
    const timestamp = Date.now();
    const email = `cashier${timestamp}@test.com`;
    const password = 'Test123!';

    // Get admin token via login
    const loginRes = await this.page.request.post('http://localhost:4000/api/auth/login', {
      data: { email: 'glozada', password: '000000' },
    });
    const { data } = await loginRes.json();
    const token = data?.accessToken;

    if (!token) throw new Error('Could not get admin token');

    // Create user
    const res = await this.page.request.post('http://localhost:4000/api/users', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        email,
        password,
        firstName: 'Cajero',
        lastName: `Test ${timestamp}`,
        role: 'cashier',
      },
    });

    if (!res.ok()) {
      const body = await res.json();
      throw new Error(`Failed to create user: ${JSON.stringify(body)}`);
    }

    return { email, password };
  }

  async loginAsCashier(email: string, password: string): Promise<void> {
    await this.loginPage.navigate();
    await this.loginPage.login(email, password);
    await this.page.waitForURL(/dashboard/);
  }

  async execute(): Promise<void> {
    const creds = await this.createCashierViaApi();
    await this.loginAsCashier(creds.email, creds.password);
  }

  async validate(exists: boolean): Promise<void> {
    if (!exists) throw new Error('Registration flow failed');
  }
}
