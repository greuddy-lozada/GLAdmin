'use client';

import { useOptimisticCrud } from '@/hooks/use-optimistic-crud';
import { Company, CreateCompanyRequest, UpdateCompanyRequest } from '../models/company.model';
import { companyService } from '../services/company.service';

function buildOptimistic(data: CreateCompanyRequest, tempId: number): Company {
  return {
    id: tempId,
    taxId: data.taxId,
    name: data.name,
    address: data.address,
    phoneNumber: data.phoneNumber,
    email: data.email,
    website: data.website ?? null,
    isWithholdingAgent: data.isWithholdingAgent ?? false,
    withholdingPercentage: data.withholdingPercentage,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function useCompanies() {
  return useOptimisticCrud<Company, CreateCompanyRequest, UpdateCompanyRequest>({
    queryKey: ['companies'],
    queryFn: () => companyService.getAll(),
    createFn: (data) => companyService.create(data),
    updateFn: (id, data) => companyService.update(id, data),
    deleteFn: (id) => companyService.delete(id),
    buildOptimistic,
  });
}
