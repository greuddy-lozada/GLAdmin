import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { sileo } from 'sileo';
import type { CartItem } from '@/features/pos/models/pos.model';
import type { LocalProduct } from '@/lib/sync/db';

export type TaxMap = Record<number, { name: string; percentage: number }>;

interface PosState {
  cart: CartItem[];
  customerId?: number;
  customerName?: string;
  customerTaxId?: string;
  withholdingPercentage: number | null;
  lastAddedProductId: number | null;
  exchangeRate: number;

  addToCart: (product: LocalProduct, taxes: TaxMap) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number, productStock?: number) => void;
  clearCart: () => void;
  undoLastItem: () => void;
  setCart: (items: CartItem[]) => void;
  setCustomer: (id?: number, name?: string, taxId?: string, withholdingPercentage?: number | null) => void;
  clearCustomer: () => void;
  setExchangeRate: (rate: number) => void;
}

export const usePosStore = create<PosState>()(
  persist(
    (set, get) => ({
      cart: [],
      customerId: undefined,
      customerName: undefined,
      customerTaxId: undefined,
      withholdingPercentage: null,
      lastAddedProductId: null,
      exchangeRate: 0,

      addToCart: (product, taxes) => {
        const { cart, exchangeRate } = get();
        const currentQty = cart.find(item => item.productId === product.id)?.quantity ?? 0;
        if (currentQty + 1 > product.stock) {
          sileo.error({ description: `Stock insuficiente para ${product.name}` });
          return;
        }

        const unitPriceUsd = product.priceUsd || (exchangeRate > 0 ? product.price / exchangeRate : 0);
        const unitPrice = exchangeRate > 0 && product.priceUsd ? unitPriceUsd * exchangeRate : product.price;

        const taxInfo = product.taxId ? taxes[product.taxId] : undefined;
        const taxAmount = taxInfo ? unitPrice * (taxInfo.percentage / 100) : 0;
        const taxAmountUsd = taxInfo ? unitPriceUsd * (taxInfo.percentage / 100) : 0;

        const existing = cart.find(item => item.productId === product.id);
        if (existing) {
          set({
            cart: cart.map(item =>
              item.productId === product.id
                ? {
                    ...item,
                    quantity: item.quantity + 1,
                    subtotal: (item.quantity + 1) * unitPrice,
                    subtotalUsd: (item.quantity + 1) * unitPriceUsd,
                    taxAmount: item.taxPercentage ? (item.quantity + 1) * unitPrice * (item.taxPercentage / 100) : 0,
                    taxAmountUsd: item.taxPercentage ? (item.quantity + 1) * unitPriceUsd * (item.taxPercentage / 100) : 0,
                  }
                : item
            ),
            lastAddedProductId: product.id,
          });
        } else {
          set({
            cart: [
              ...cart,
              {
                productId: product.id,
                name: product.name,
                quantity: 1,
                unitPrice,
                unitPriceUsd,
                subtotal: unitPrice,
                subtotalUsd: unitPriceUsd,
                taxName: taxInfo?.name,
                taxPercentage: taxInfo?.percentage,
                taxAmount,
                taxAmountUsd,
              },
            ],
            lastAddedProductId: product.id,
          });
        }
      },

      removeFromCart: (productId) => {
        set(state => ({ cart: state.cart.filter(item => item.productId !== productId) }));
      },

      updateQuantity: (productId, quantity, productStock) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }

        if (productStock != null && quantity > productStock) {
          sileo.error({ description: `Stock insuficiente` });
          return;
        }

        set(state => ({
          cart: state.cart.map(item =>
            item.productId === productId
              ? {
                  ...item,
                  quantity,
                  subtotal: quantity * item.unitPrice,
                  subtotalUsd: quantity * item.unitPriceUsd,
                  taxAmount: item.taxPercentage ? quantity * item.unitPrice * (item.taxPercentage / 100) : 0,
                  taxAmountUsd: item.taxPercentage ? quantity * item.unitPriceUsd * (item.taxPercentage / 100) : 0,
                }
              : item
          ),
        }));
      },

      clearCart: () => set({ cart: [], lastAddedProductId: null }),

      undoLastItem: () => {
        const { lastAddedProductId, cart } = get();
        if (lastAddedProductId === null) return;
        const item = cart.find(i => i.productId === lastAddedProductId);
        if (!item) {
          set({ lastAddedProductId: null });
          return;
        }
        if (item.quantity > 1) {
          set({
            cart: cart.map(i =>
              i.productId === lastAddedProductId
                ? {
                    ...i,
                    quantity: i.quantity - 1,
                    subtotal: (i.quantity - 1) * i.unitPrice,
                    subtotalUsd: (i.quantity - 1) * i.unitPriceUsd,
                    taxAmount: i.taxPercentage ? (i.quantity - 1) * i.unitPrice * (i.taxPercentage / 100) : 0,
                    taxAmountUsd: i.taxPercentage ? (i.quantity - 1) * i.unitPriceUsd * (i.taxPercentage / 100) : 0,
                  }
                : i
            ),
            lastAddedProductId: null,
          });
        } else {
          set({
            cart: cart.filter(i => i.productId !== lastAddedProductId),
            lastAddedProductId: null,
          });
        }
      },

      setCart: (items) => set({ cart: items }),

      setCustomer: (id, name, taxId, withholdingPct) => set({
        customerId: id,
        customerName: name,
        customerTaxId: taxId,
        withholdingPercentage: withholdingPct ?? null,
      }),

      clearCustomer: () => set({
        customerId: undefined,
        customerName: undefined,
        customerTaxId: undefined,
        withholdingPercentage: null,
      }),

      setExchangeRate: (rate) => set({ exchangeRate: rate }),
    }),
    {
      name: 'pos-storage',
      partialize: (state) => ({
        cart: state.cart,
        customerId: state.customerId,
        customerName: state.customerName,
        customerTaxId: state.customerTaxId,
        withholdingPercentage: state.withholdingPercentage,
        lastAddedProductId: state.lastAddedProductId,
        exchangeRate: state.exchangeRate,
      }),
    },
  ),
);
