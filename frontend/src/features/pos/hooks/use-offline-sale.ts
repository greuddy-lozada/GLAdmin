import { localDb } from '@/lib/sync/db';
import { syncQueue } from '@/lib/sync/sync-queue';
import type { CartItem } from '../models/pos.model';
import { PaymentMethod, type CreateSaleRequest } from '../models/pos.model';

export function useOfflineSale() {
  const createSale = async (
    cart: CartItem[],
    total: number,
    totalUsd: number,
    exchangeRate: number,
    paymentMethod: PaymentMethod,
    customerId?: number,
  ) => {
    const saleData: CreateSaleRequest = {
      code: `SALE-${Date.now()}`,
      date: new Date().toISOString(),
      amount: total,
      amountUsd: totalUsd,
      exchangeRate,
      paymentMethod,
      status: 1,
      idCustomer: customerId,
      items: cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitPriceUsd: item.unitPriceUsd,
        subtotal: item.subtotal,
        subtotalUsd: item.subtotalUsd,
        taxName: item.taxName,
        taxPercentage: item.taxPercentage,
        taxAmount: item.taxAmount,
        taxAmountUsd: item.taxAmountUsd,
      })),
      totalTax: cart.reduce((s, i) => s + (i.taxAmount || 0), 0),
      totalTaxUsd: cart.reduce((s, i) => s + (i.taxAmountUsd || 0), 0),
    };

    const stockSnapshot: Record<number, number> = {};
    for (const item of cart) {
      const stock = await localDb.stockCache.get(item.productId);
      if (stock) {
        stockSnapshot[item.productId] = stock.quantity;
      }
    }

    await localDb.sales.add({
      localId: saleData.code,
      data: saleData,
      createdAt: new Date().toISOString(),
    });

    await syncQueue.enqueue({
      operation: 'create',
      table: 'sales',
      data: saleData,
      stockSnapshot,
      localTimestamp: new Date().toISOString(),
    });

    for (const item of cart) {
      const stock = await localDb.stockCache.get(item.productId);
      if (stock) {
        await localDb.stockCache.update(item.productId, {
          quantity: stock.quantity - item.quantity,
          lastUpdated: new Date().toISOString(),
        });
      }
    }
  };

  return { createSale };
}
