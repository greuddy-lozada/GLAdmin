import { test } from '../../shared/fixtures/auth.fixture';
import { SidebarComponent } from '../../shared/components/sidebar.component';
import { InventoryPage } from './inventory.page';

test.describe('Inventory', () => {
  test('debe mostrar alertas de stock', async ({ authenticatedPage: page }) => {
    const sidebar = new SidebarComponent(page);
    await sidebar.navigateTo('Stocks');

    const inventoryPage = new InventoryPage(page);
    await inventoryPage.waitForLoad();
  });
});
