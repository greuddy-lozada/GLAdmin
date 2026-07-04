import { CrudTask } from '../../shared/tasks/crud.task';
import type { Page } from '@playwright/test';
import type { CustomerData } from '../../shared/builders/customer.builder';
import { CustomersPage } from './customers.page';
import { CustomerValidator } from './customer.validator';
import { SlideFormComponent } from '../../shared/components/slide-form.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

export class CustomerCrudTask extends CrudTask<CustomerData> {
  protected validator: CustomerValidator;
  private readonly pageObj: CustomersPage;
  private readonly form: SlideFormComponent;
  private readonly dialog: ConfirmDialogComponent;

  constructor(page: Page) {
    super(page);
    this.pageObj = new CustomersPage(page);
    this.validator = new CustomerValidator(page);
    this.form = new SlideFormComponent(page);
    this.dialog = new ConfirmDialogComponent(page);
  }

  async create(data: CustomerData): Promise<void> {
    await this.pageObj.table.clickCreate();
    await this.form.waitForOpen();
    await this.form.fill('name', data.name);
    await this.form.fill('rif', data.rif);
    if (data.email) await this.form.fill('email', data.email);
    if (data.phone) await this.form.fill('phone', data.phone);
    await this.form.submit();
    await this.validator.expectSuccess();
    await this.form.waitForClose();
  }

  async read(name: string): Promise<boolean> {
    return this.pageObj.table.hasRowWithText(name);
  }

  async update(name: string, data: Partial<CustomerData>): Promise<void> {
    await this.pageObj.table.clickRowAction(name, 'edit');
    await this.form.waitForOpen();
    if (data.name) await this.form.fill('name', data.name);
    if (data.email) await this.form.fill('email', data.email);
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
