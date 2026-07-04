import { test, expect } from '../../shared/fixtures/auth.fixture';
import { SidebarComponent } from '../../shared/components/sidebar.component';
import { BillingPage } from './billing.page';
import { SubscribeTask } from './subscribe.task';

test.describe('Billing', () => {
  test('debe mostrar los planes disponibles', async ({ authenticatedPage: page }) => {
    const sidebar = new SidebarComponent(page);
    await sidebar.navigateTo('Facturación');

    const billingPage = new BillingPage(page);
    await billingPage.waitForLoad();

    await expect(billingPage.planCards.first()).toBeVisible();
  });

  test('debe abrir formulario de Pago Móvil al seleccionar plan', async ({ authenticatedPage: page }) => {
    const sidebar = new SidebarComponent(page);
    await sidebar.navigateTo('Facturación');

    const billingPage = new BillingPage(page);
    await billingPage.waitForLoad();

    const task = new SubscribeTask(page);
    await task.selectPlan();
    await task.openPagoMovilForm();
  });
});
