'use client';

import { useOptimisticCrud } from '@/hooks/use-optimistic-crud';
import { Supplier, CreateSupplierRequest, UpdateSupplierRequest } from '../models/supplier.model';
import { supplierService } from '../services/supplier.service';

function buildOptimistic(data: CreateSupplierRequest, tempId: string): Supplier {
  return {
    id: tempId,
    companyName: data.companyName,
    businessName: data.businessName ?? null,
    fiscalAddress: data.fiscalAddress ?? null,
    taxId: data.taxId ?? null,
    taxWithholdingAgent: data.taxWithholdingAgent ?? false,
    firstName: data.firstName ?? null,
    lastName: data.lastName ?? null,
    address: data.address ?? null,
    phoneNumber: data.phoneNumber ?? null,
    email: data.email ?? null,
    available: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function useSuppliers() {
  return useOptimisticCrud<Supplier, CreateSupplierRequest, UpdateSupplierRequest>({
    queryKey: ['suppliers'],
    queryFn: () => supplierService.getAll(),
    createFn: (data) => supplierService.create(data),
    updateFn: (id, data) => supplierService.update(id, data),
    deleteFn: (id) => supplierService.delete(id),
    buildOptimistic,
  });
}
