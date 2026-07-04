import { test, expect } from '../../shared/fixtures/auth.fixture';
import { LoginPage } from '../../shared/pages/login.page';
import { DashboardPage } from '../../shared/pages/dashboard.page';

test.describe('Auth', () => {
  test('debe hacer login exitoso y ver dashboard', async ({ authenticatedPage: page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.waitForLoad();
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('login con credenciales inválidas debe mostrar error', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login('nadie', 'wrong');

    const errorEl = page.locator('[role="alert"]');
    await errorEl.waitFor({ state: 'visible', timeout: 5000 });
  });

  test('logout debe redirigir a login', async ({ authenticatedPage: page }) => {
    await page.locator('button', { hasText: /cerrar sesión|logout/i }).click();
    await page.waitForURL(/login/);
  });
});
