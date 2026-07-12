'use client';

import { useOptimisticCrud } from '@/hooks/use-optimistic-crud';
import { PurchaseOrder, CreatePurchaseOrderRequest, UpdatePurchaseOrderRequest } from '../models/purchase-order.model';
import { purchaseOrderService } from '../services/purchase-order.service';

function buildOptimistic(data: CreatePurchaseOrderRequest, tempId: string): PurchaseOrder {
  return {
    id: tempId,
    idSupplier: data.idSupplier,
    code: data.code,
    date: data.date,
    amount: data.amount,
    amountUsd: data.amountUsd,
    baseAmount: data.baseAmount,
    baseAmountUsd: data.baseAmountUsd,
    ivaAmount: data.ivaAmount,
    ivaAmountUsd: data.ivaAmountUsd,
    exchangeRate: data.exchangeRate,
    exchangeRateDayId: data.exchangeRateDayId,
    exchangeRateId: undefined,
    officialExchangeRate: data.officialExchangeRate,
    officialExchangeRateId: data.officialExchangeRateId,
    paymentMethod: data.paymentMethod,
    status: data.status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  };
}

export function usePurchaseOrders() {
  return useOptimisticCrud<PurchaseOrder, CreatePurchaseOrderRequest, UpdatePurchaseOrderRequest>({
    queryKey: ['purchaseOrders'],
    queryFn: () => purchaseOrderService.getAll(),
    createFn: (data) => purchaseOrderService.create(data),
    updateFn: (id, data) => purchaseOrderService.update(id, data),
    deleteFn: (id) => purchaseOrderService.delete(id),
    buildOptimistic,
  });
}
