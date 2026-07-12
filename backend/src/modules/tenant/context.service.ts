import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  organizationId: string;
  organizationSlug?: string;
  isSuperAdmin?: boolean;
  plan?: { name: string; features: string[] };
  planFeatures?: string[];
}

@Injectable()
export class ContextService {
  private storage = new AsyncLocalStorage<TenantContext>();

  run(context: TenantContext, fn: () => Promise<void>) {
    return this.storage.run(context, fn);
  }

  getCurrent(): TenantContext | undefined {
    return this.storage.getStore();
  }
}
