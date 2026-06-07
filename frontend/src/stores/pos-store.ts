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
  lastAddedProductId: number | null;
  exchangeRate: number;

  addToCart: (product: LocalProduct, taxes: TaxMap) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number, products: LocalProduct[]) => void;
  clearCart: () => void;
  undoLastItem: () => void;
  setCart: (items: CartItem[]) => void;
  setCustomer: (id?: number, name?: string) => void;
  clearCustomer: () => void;
  setExchangeRate: (rate: number) => void;
}

export const usePosStore = create<PosState>()(
  persist(
    (set, get) => ({
      cart: [],
      customerId: undefined,
      customerName: undefined,
      lastAddedProductId: null,
      exchangeRate: 0,

      addToCart: (product, taxes) => {
        const { cart } = get();
        const currentQty = cart.find(item => item.productId === product.id)?.quantity ?? 0;
        if (currentQty + 1 > product.stock) {
          sileo.error({ description: `Stock insuficiente para ${product.name}` });
          return;
        }

        const taxInfo = product.taxId ? taxes[product.taxId] : undefined;
        const taxAmount = taxInfo ? product.price * (taxInfo.percentage / 100) : 0;
        const taxAmountUsd = taxInfo ? (product.priceUsd || 0) * (taxInfo.percentage / 100) : 0;

        const existing = cart.find(item => item.productId === product.id);
        if (existing) {
          set({
            cart: cart.map(item =>
              item.productId === product.id
                ? {
                    ...item,
                    quantity: item.quantity + 1,
                    subtotal: (item.quantity + 1) * item.unitPrice,
                    subtotalUsd: (item.quantity + 1) * item.unitPriceUsd,
                    taxAmount: item.taxAmount ? (item.taxAmount / item.quantity) * (item.quantity + 1) : 0,
                    taxAmountUsd: item.taxAmountUsd ? (item.taxAmountUsd / item.quantity) * (item.quantity + 1) : 0,
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
                unitPrice: product.price,
                unitPriceUsd: product.priceUsd || 0,
                subtotal: product.price,
                subtotalUsd: product.priceUsd || 0,
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

      updateQuantity: (productId, quantity, products) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }

        const product = products.find(p => p.id === productId);
        if (quantity > (product?.stock ?? 0)) {
          sileo.error({ description: `Stock insuficiente para ${product?.name}` });
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

      setCustomer: (id, name) => set({ customerId: id, customerName: name }),

      clearCustomer: () => set({ customerId: undefined, customerName: undefined }),

      setExchangeRate: (rate) => set({ exchangeRate: rate }),
    }),
    {
      name: 'pos-storage',
      partialize: (state) => ({
        cart: state.cart,
        customerId: state.customerId,
        customerName: state.customerName,
        lastAddedProductId: state.lastAddedProductId,
        exchangeRate: state.exchangeRate,
      }),
    },
  ),
);
