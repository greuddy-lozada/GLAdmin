import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  url = '/login';

  private readonly emailInput = this.byPlaceholder('Email');
  private readonly passwordInput = this.byPlaceholder('Password');
  private readonly submitButton = this.byRole('button', 'Sign in');

  async waitForLoad(): Promise<void> {
    await this.emailInput.waitFor({ state: 'visible' });
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async waitForDashboard(): Promise<void> {
    await this.page.waitForURL(/dashboard/);
  }
}
