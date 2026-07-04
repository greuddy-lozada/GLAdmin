import { AbstractTask } from './base.task';
import type { Page } from '@playwright/test';
import type { AbstractValidator } from '../validators/base.validator';

export abstract class CrudTask<T> extends AbstractTask {
  protected abstract validator: AbstractValidator;

  constructor(page: Page) {
    super(page);
  }

  abstract create(data: T): Promise<void>;
  abstract read(name: string): Promise<boolean>;
  abstract update(name: string, data: Partial<T>): Promise<void>;
  abstract delete(name: string): Promise<void>;

  async execute(data: T): Promise<void> {
    const name = (data as { name: string }).name;
    await this.create(data);
    await this.validate(await this.read(name));
    await this.update(name, {});
    await this.delete(name);
  }

  async validate(exists: boolean): Promise<void> {
    if (!exists) throw new Error('Item not found after create');
  }
}
