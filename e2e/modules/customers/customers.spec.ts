import { test, expect } from '../../shared/fixtures/auth.fixture';
import { SidebarComponent } from '../../shared/components/sidebar.component';
import { CustomersPage } from './customers.page';
import { CustomerCrudTask } from './customer-crud.task';
import { CustomerBuilder } from '../../shared/builders/customer.builder';

test.describe('Customers', () => {
  test('debe crear y eliminar un cliente', async ({ authenticatedPage: page }) => {
    const sidebar = new SidebarComponent(page);
    await sidebar.navigateTo('Clientes');

    const customersPage = new CustomersPage(page);
    await customersPage.waitForLoad();

    const task = new CustomerCrudTask(page);
    const customer = new CustomerBuilder()
      .withName('Cliente Test SA')
      .withRif('J-12345678-9')
      .build();

    await task.create(customer);
    await expect(customersPage.table.root).toContainText('Cliente Test SA');
    await task.delete('Cliente Test SA');
  });
});
