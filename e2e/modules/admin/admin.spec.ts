import { test } from '../../shared/fixtures/auth.fixture';
import { SidebarComponent } from '../../shared/components/sidebar.component';
import { AdminPage } from './admin.page';

test.describe('Admin', () => {
  test('debe mostrar panel de administración', async ({ authenticatedPage: page }) => {
    const sidebar = new SidebarComponent(page);
    await sidebar.navigateTo('Admin');

    const adminPage = new AdminPage(page);
    await adminPage.waitForLoad();
  });
});
