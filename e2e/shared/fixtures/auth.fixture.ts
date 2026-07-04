import { test as base, type Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

export interface AuthFixtures {
  authenticatedPage: Page;
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login('glozada', '000000');
    await loginPage.waitForDashboard();
    await page.context().storageState({ path: 'e2e/.auth/user.json' });
    await use(page);
  },
});

export { expect } from '@playwright/test';
