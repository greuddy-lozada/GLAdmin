import { test, expect } from '../../shared/fixtures/auth.fixture';
import { SidebarComponent } from '../../shared/components/sidebar.component';
import { InvoicesPage } from './invoices.page';
import { InvoiceLifecycleTask } from './invoice-lifecycle.task';
import type { SaleData } from '../../shared/builders/sale.builder';

test.describe('Invoice Lifecycle', () => {
  test('flujo completo: crear venta, verificar en historial, cancelar', async ({ authenticatedPage: page }) => {
    const sidebar = new SidebarComponent(page);
    await sidebar.navigateTo('POS');

    const invoicesPage = new InvoicesPage(page);
    const task = new InvoiceLifecycleTask(page);

    await task.createSale();
    await task.verifySaleInHistory();
    await task.cancelLastSale();
  });
});
