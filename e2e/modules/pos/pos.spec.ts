import { test, expect } from '../../shared/fixtures/auth.fixture';
import { SidebarComponent } from '../../shared/components/sidebar.component';
import { PosPage } from './pos.page';
import { CheckoutTask } from './checkout.task';

test.describe('POS', () => {
  test('debe cargar la página de POS', async ({ authenticatedPage: page }) => {
    const sidebar = new SidebarComponent(page);
    await sidebar.navigateTo('POS');

    const posPage = new PosPage(page);
    await posPage.waitForLoad();
    await expect(posPage.productSearch).toBeVisible();
  });

  test('debe buscar producto y completar checkout', async ({ authenticatedPage: page }) => {
    const sidebar = new SidebarComponent(page);
    await sidebar.navigateTo('POS');

    const posPage = new PosPage(page);
    await posPage.waitForLoad();

    const task = new CheckoutTask(page);
    await task.addProduct('Martillo');
    await task.completeCheckout();
  });
});
