import { CrudTask } from '../../shared/tasks/crud.task';
import type { Page } from '@playwright/test';
import type { ProductData } from '../../shared/builders/product.builder';
import { ProductsPage } from './products.page';
import { ProductValidator } from './product.validator';
import { SlideFormComponent } from '../../shared/components/slide-form.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

export class ProductCrudTask extends CrudTask<ProductData> {
  protected validator: ProductValidator;
  private readonly pageObj: ProductsPage;
  private readonly form: SlideFormComponent;
  private readonly dialog: ConfirmDialogComponent;

  constructor(page: Page) {
    super(page);
    this.pageObj = new ProductsPage(page);
    this.validator = new ProductValidator(page);
    this.form = new SlideFormComponent(page);
    this.dialog = new ConfirmDialogComponent(page);
  }

  async create(data: ProductData): Promise<void> {
    await this.pageObj.table.clickCreate();
    await this.form.waitForOpen();
    await this.form.fill('name', data.name);
    await this.form.fill('price', String(data.price));
    await this.form.submit();
    await this.validator.expectSuccess();
    await this.form.waitForClose();
  }

  async read(name: string): Promise<boolean> {
    return this.pageObj.table.hasRowWithText(name);
  }

  async update(name: string, data: Partial<ProductData>): Promise<void> {
    await this.pageObj.table.clickRowAction(name, 'edit');
    await this.form.waitForOpen();
    if (data.name) await this.form.fill('name', data.name);
    if (data.price) await this.form.fill('price', String(data.price));
    await this.form.submit();
    await this.validator.expectSuccess();
    await this.form.waitForClose();
  }

  async delete(name: string): Promise<void> {
    await this.pageObj.table.clickRowAction(name, 'delete');
    await this.dialog.confirm();
    await this.validator.expectSuccess();
    await this.validator.expectNotVisible(name);
  }
}
