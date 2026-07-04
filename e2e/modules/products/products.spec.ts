import { test, expect } from '../../shared/fixtures/auth.fixture';
import { SidebarComponent } from '../../shared/components/sidebar.component';
import { ProductsPage } from './products.page';
import { ProductCrudTask } from './product-crud.task';
import { ProductBuilder } from '../../shared/builders/product.builder';

test.describe('Products', () => {
  test.describe('CRUD', () => {
    test('debe crear y eliminar un producto', async ({ authenticatedPage: page }) => {
      const sidebar = new SidebarComponent(page);
      await sidebar.navigateTo('Productos');

      const productsPage = new ProductsPage(page);
      await productsPage.waitForLoad();

      const task = new ProductCrudTask(page);
      const product = new ProductBuilder()
        .withName('Laptop Pro X1')
        .withPrice(1200)
        .build();

      await task.create(product);
      await expect(productsPage.table.root).toContainText('Laptop Pro X1');
      await task.delete('Laptop Pro X1');
    });

    test('debe mostrar tabla de productos', async ({ authenticatedPage: page }) => {
      const sidebar = new SidebarComponent(page);
      await sidebar.navigateTo('Productos');

      const productsPage = new ProductsPage(page);
      await productsPage.waitForLoad();
    });
  });
});
