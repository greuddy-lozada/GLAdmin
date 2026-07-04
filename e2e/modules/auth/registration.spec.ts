import { test, expect } from '../../shared/fixtures/auth.fixture';
import { SidebarComponent } from '../../shared/components/sidebar.component';
import { RegistrationTask } from './registration.task';

test.describe('User Registration', () => {
  test('admin debe crear cajero y cajero solo debe ver POS', async ({ authenticatedPage: page }) => {
    const task = new RegistrationTask(page);

    // API: crear cajero
    const cashierData = await task.createCashierViaApi();

    // UI: login como cajero
    await task.loginAsCashier(cashierData.email, cashierData.password);

    // Verificar: solo ve POS, no ve Admin
    const sidebar = new SidebarComponent(page);
    expect(await sidebar.isModuleVisible('POS')).toBeTruthy();
    expect(await sidebar.isModuleVisible('Admin')).toBeFalsy();
  });
});
