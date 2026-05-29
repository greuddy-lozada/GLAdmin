import { localDb } from '@/lib/sync/db';
import { syncQueue } from '@/lib/sync/sync-queue';
import type { CartItem } from './use-pos';

export function useOfflineSale() {
  const createSale = async (
    cart: CartItem[],
    total: number,
    totalUsd: number,
    exchangeRate: number,
    paymentMethod: number,
    customerId?: number,
  ) => {
    const saleData = {
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
      })),
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
