import { useState, useEffect, useMemo, useCallback } from 'react';
import { localDb, type LocalProduct } from '@/lib/sync/db';
import { usePosStore, type TaxMap } from '@/stores/pos-store';
import type { CartItem } from '../models/pos.model';

export function usePos() {
  const cart = usePosStore(s => s.cart);
  const exchangeRate = usePosStore(s => s.exchangeRate);

  const addToCartAction = usePosStore(s => s.addToCart);
  const removeFromCart = usePosStore(s => s.removeFromCart);
  const updateQuantityAction = usePosStore(s => s.updateQuantity);
  const clearCart = usePosStore(s => s.clearCart);
  const undoLastItem = usePosStore(s => s.undoLastItem);
  const setCart = usePosStore(s => s.setCart);

  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [taxes, setTaxes] = useState<TaxMap>({});
  const [parkRefresh, setParkRefresh] = useState(0);

  useEffect(() => {
    localDb.taxes.toArray().then(allTaxes => {
      const taxMap: TaxMap = {};
      for (const t of allTaxes) taxMap[t.id] = { name: t.name, percentage: t.percentage };
      setTaxes(taxMap);
    }).catch(console.warn);
  }, []);

  const loadProducts = useCallback(async () => {
    const allProducts = await localDb.products.toArray();
    setProducts(allProducts);
  }, []);

  const addToCart = useCallback((product: LocalProduct) => {
    addToCartAction(product, taxes);
  }, [addToCartAction, taxes]);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    updateQuantityAction(productId, quantity, products);
  }, [updateQuantityAction, products]);

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.subtotal, 0), [cart]);
  const totalUsd = useMemo(() => cart.reduce((sum, item) => sum + item.subtotalUsd, 0), [cart]);
  const totalTax = useMemo(() => cart.reduce((sum, item) => sum + (item.taxAmount || 0), 0), [cart]);
  const totalTaxUsd = useMemo(() => cart.reduce((sum, item) => sum + (item.taxAmountUsd || 0), 0), [cart]);

  const lastAddedProductId = usePosStore(s => s.lastAddedProductId);
  const canUndo = lastAddedProductId !== null && cart.some(i => i.productId === lastAddedProductId);

  const parkCart = useCallback(async (customerId?: number, customerName?: string): Promise<{ label: string; error?: string }> => {
    const state = usePosStore.getState();
    if (state.cart.length === 0) return { label: '', error: 'empty' };
    const label = `Orden #${Date.now().toString(36).slice(-4)}`;
    const t = state.cart.reduce((s, i) => s + i.subtotal, 0);
    const tUsd = state.cart.reduce((s, i) => s + i.subtotalUsd, 0);
    const tTax = state.cart.reduce((s, i) => s + (i.taxAmount || 0), 0);
    const tTaxUsd = state.cart.reduce((s, i) => s + (i.taxAmountUsd || 0), 0);
    try {
      await localDb.parkedOrders.add({
        label,
        cartItems: [...state.cart],
        customerId,
        customerName,
        total: t,
        totalUsd: tUsd,
        totalTax: tTax,
        totalTaxUsd: tTaxUsd,
        createdAt: new Date().toISOString(),
      });
      state.clearCart();
      setParkRefresh(n => n + 1);
      return { label };
    } catch (err) {
      console.warn('Park order error:', err);
      return { label, error: 'park' };
    }
  }, []);

  const resumeCart = useCallback((order: { cartItems: CartItem[]; customerId?: number; customerName?: string }): void => {
    const state = usePosStore.getState();
    if (state.cart.length > 0) {
      const merged = [...state.cart, ...order.cartItems];
      const unique = new Map<number, CartItem>();
      for (const item of merged) {
        if (unique.has(item.productId)) {
          const existing = unique.get(item.productId)!;
          const newQty = existing.quantity + item.quantity;
          unique.set(item.productId, {
            ...existing,
            quantity: newQty,
            subtotal: newQty * existing.unitPrice,
            subtotalUsd: newQty * existing.unitPriceUsd,
            taxAmount: existing.taxPercentage ? newQty * existing.unitPrice * (existing.taxPercentage / 100) : 0,
            taxAmountUsd: existing.taxPercentage ? newQty * existing.unitPriceUsd * (existing.taxPercentage / 100) : 0,
          });
        } else {
          unique.set(item.productId, item);
        }
      }
      setCart([...unique.values()]);
    } else {
      setCart(order.cartItems);
    }
  }, [setCart]);

  return {
    cart,
    products,
    loadProducts,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    total,
    totalUsd,
    totalTax,
    totalTaxUsd,
    parkCart,
    resumeCart,
    parkRefresh,
    undoLastItem,
    canUndo,
  };
}
