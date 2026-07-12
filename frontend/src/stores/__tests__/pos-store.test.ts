import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePosStore } from '@/stores/pos-store';
import type { LocalProduct } from '@/lib/sync/db';

vi.mock('sileo', () => ({
  sileo: { error: vi.fn(), warning: vi.fn(), success: vi.fn() },
}));

const makeProduct = (overrides: Partial<LocalProduct> = {}): LocalProduct => ({
  id: '2e4f7a92-8012-49f5-b5a6-1c7e5d8f3a91',
  organizationId: 'org-1',
  name: 'Test Product',
  price: 100,
  stock: 10,
  margin: 20,
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

const taxMap = {
  'tax-1': { name: 'IVA', percentage: 16 },
  'tax-2': { name: 'Luxury', percentage: 30 },
};

const resetStore = () => {
  localStorage.clear();
  usePosStore.setState({
    cart: [],
    customerId: undefined,
    customerName: undefined,
    customerTaxId: undefined,
    withholdingPercentage: null,
    lastAddedProductId: null,
    exchangeRate: 0,
  });
};

describe('pos-store', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('addToCart', () => {
    it('adds a new product to the cart with correct defaults', () => {
      const product = makeProduct();
      usePosStore.getState().addToCart(product, {});

      const { cart, lastAddedProductId } = usePosStore.getState();
      expect(cart).toHaveLength(1);
      expect(cart[0]).toMatchObject({
        productId: product.id,
        name: product.name,
        quantity: 1,
        subtotal: product.price,
        subtotalUsd: 0,
        taxAmount: 0,
        taxAmountUsd: 0,
      });
      expect(lastAddedProductId).toBe(product.id);
    });

    it('increments quantity when product already exists in cart', () => {
      const product = makeProduct();
      const { addToCart } = usePosStore.getState();
      addToCart(product, {});
      addToCart(product, {});

      const { cart } = usePosStore.getState();
      expect(cart).toHaveLength(1);
      expect(cart[0].quantity).toBe(2);
      expect(cart[0].subtotal).toBe(product.price * 2);
    });

    it('applies tax when product has a matching taxId', () => {
      const product = makeProduct({ taxId: 'tax-1' });
      usePosStore.getState().addToCart(product, taxMap);

      const { cart } = usePosStore.getState();
      expect(cart[0].taxName).toBe('IVA');
      expect(cart[0].taxPercentage).toBe(16);
      expect(cart[0].taxAmount).toBeCloseTo(16);
    });

    it('recalculates tax correctly when quantity is incremented', () => {
      const product = makeProduct({ taxId: 'tax-1' });
      const { addToCart } = usePosStore.getState();
      addToCart(product, taxMap);
      addToCart(product, taxMap);

      const { cart } = usePosStore.getState();
      expect(cart[0].quantity).toBe(2);
      expect(cart[0].taxAmount).toBeCloseTo(32);
    });

    it('does not apply tax when product has no taxId', () => {
      const product = makeProduct();
      usePosStore.getState().addToCart(product, taxMap);

      const { cart } = usePosStore.getState();
      expect(cart[0].taxName).toBeUndefined();
      expect(cart[0].taxPercentage).toBeUndefined();
      expect(cart[0].taxAmount).toBe(0);
    });

    it('rejects adding when stock limit is exceeded', () => {
      const product = makeProduct({ stock: 1 });
      const { addToCart } = usePosStore.getState();
      addToCart(product, {});
      addToCart(product, {});

      const { cart } = usePosStore.getState();
      expect(cart).toHaveLength(1);
      expect(cart[0].quantity).toBe(1);
    });

    it('tracks lastAddedProductId across multiple products', () => {
      const p1 = makeProduct({ id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1' });
      const p2 = makeProduct({ id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee2' });
      const { addToCart } = usePosStore.getState();
      addToCart(p1, {});
      expect(usePosStore.getState().lastAddedProductId).toBe(p1.id);
      addToCart(p2, {});
      expect(usePosStore.getState().lastAddedProductId).toBe(p2.id);
    });
  });

  describe('removeFromCart', () => {
    it('removes the matching product from the cart', () => {
      const p1 = makeProduct({ id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1' });
      const p2 = makeProduct({ id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee2' });
      const { addToCart, removeFromCart } = usePosStore.getState();
      addToCart(p1, {});
      addToCart(p2, {});

      removeFromCart(p1.id);
      const { cart } = usePosStore.getState();
      expect(cart).toHaveLength(1);
      expect(cart[0].productId).toBe(p2.id);
    });

    it('does nothing when productId is not in cart', () => {
      const product = makeProduct();
      usePosStore.getState().addToCart(product, {});
      usePosStore.getState().removeFromCart('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeen');
      expect(usePosStore.getState().cart).toHaveLength(1);
    });

    it('handles removal of the last item', () => {
      const product = makeProduct();
      usePosStore.getState().addToCart(product, {});
      usePosStore.getState().removeFromCart(product.id);
      expect(usePosStore.getState().cart).toEqual([]);
    });
  });

  describe('updateQuantity', () => {
    it('updates quantity and recalculates subtotal and tax', () => {
      const product = makeProduct({ taxId: 'tax-1' });
      const { addToCart, updateQuantity } = usePosStore.getState();
      addToCart(product, taxMap);
      updateQuantity(product.id, 5);

      const item = usePosStore.getState().cart[0];
      expect(item.quantity).toBe(5);
      expect(item.subtotal).toBe(500);
      expect(item.taxAmount).toBeCloseTo(80);
    });

    it('removes item when quantity is 0', () => {
      const product = makeProduct();
      const { addToCart, updateQuantity } = usePosStore.getState();
      addToCart(product, {});
      updateQuantity(product.id, 0);

      expect(usePosStore.getState().cart).toHaveLength(0);
    });

    it('removes item when quantity is negative', () => {
      const product = makeProduct();
      const { addToCart, updateQuantity } = usePosStore.getState();
      addToCart(product, {});
      updateQuantity(product.id, -1);

      expect(usePosStore.getState().cart).toHaveLength(0);
    });

    it('rejects update when quantity exceeds product stock', () => {
      const product = makeProduct({ stock: 3 });
      const { addToCart, updateQuantity } = usePosStore.getState();
      addToCart(product, {});
      updateQuantity(product.id, 10, product.stock);

      expect(usePosStore.getState().cart[0].quantity).toBe(1);
    });

    it('allows any quantity when productStock is not provided', () => {
      const product = makeProduct();
      const { addToCart, updateQuantity } = usePosStore.getState();
      addToCart(product, {});
      updateQuantity(product.id, 999);

      expect(usePosStore.getState().cart[0].quantity).toBe(999);
    });
  });

  describe('setCustomer', () => {
    it('stores all customer fields', () => {
      usePosStore.getState().setCustomer(
        'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1',
        'John Doe',
        'J-123456',
        5,
      );
      const s = usePosStore.getState();
      expect(s.customerId).toBe('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1');
      expect(s.customerName).toBe('John Doe');
      expect(s.customerTaxId).toBe('J-123456');
      expect(s.withholdingPercentage).toBe(5);
    });

    it('defaults withholdingPercentage to null when not provided', () => {
      usePosStore.getState().setCustomer(
        'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1',
        'John Doe',
        'J-123',
      );
      expect(usePosStore.getState().withholdingPercentage).toBeNull();
    });

    it('clears fields when called with only customerId', () => {
      usePosStore.getState().setCustomer(
        'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1',
        'John Doe',
        'J-123',
        5,
      );
      usePosStore.getState().setCustomer('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee2');
      const s = usePosStore.getState();
      expect(s.customerId).toBe('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee2');
      expect(s.customerName).toBeUndefined();
      expect(s.customerTaxId).toBeUndefined();
      expect(s.withholdingPercentage).toBeNull();
    });
  });

  describe('clearCustomer', () => {
    it('resets all customer fields', () => {
      usePosStore.getState().setCustomer(
        'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1',
        'John',
        'J-123',
        5,
      );
      usePosStore.getState().clearCustomer();
      const s = usePosStore.getState();
      expect(s.customerId).toBeUndefined();
      expect(s.customerName).toBeUndefined();
      expect(s.customerTaxId).toBeUndefined();
      expect(s.withholdingPercentage).toBeNull();
    });

    it('is idempotent', () => {
      expect(() => usePosStore.getState().clearCustomer()).not.toThrow();
      expect(usePosStore.getState().customerId).toBeUndefined();
    });
  });

  describe('clearCart', () => {
    it('empties cart and resets lastAddedProductId', () => {
      const product = makeProduct();
      const { addToCart, clearCart } = usePosStore.getState();
      addToCart(product, {});
      clearCart();

      const s = usePosStore.getState();
      expect(s.cart).toHaveLength(0);
      expect(s.lastAddedProductId).toBeNull();
    });

    it('preserves customer information', () => {
      usePosStore.getState().setCustomer(
        'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1',
        'John',
      );
      const { addToCart, clearCart } = usePosStore.getState();
      addToCart(makeProduct(), {});
      clearCart();

      expect(usePosStore.getState().customerId).toBe('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1');
    });
  });

  describe('undoLastItem', () => {
    it('removes item when it has quantity 1', () => {
      const product = makeProduct();
      const { addToCart, undoLastItem } = usePosStore.getState();
      addToCart(product, {});
      undoLastItem();

      const s = usePosStore.getState();
      expect(s.cart).toHaveLength(0);
      expect(s.lastAddedProductId).toBeNull();
    });

    it('decrements quantity when item has quantity > 1', () => {
      const product = makeProduct();
      const { addToCart, undoLastItem } = usePosStore.getState();
      addToCart(product, {});
      addToCart(product, {});
      undoLastItem();

      const s = usePosStore.getState();
      expect(s.cart[0].quantity).toBe(1);
      expect(s.cart[0].subtotal).toBe(product.price);
    });

    it('does nothing when no product has been added', () => {
      expect(() => usePosStore.getState().undoLastItem()).not.toThrow();
      expect(usePosStore.getState().cart).toHaveLength(0);
    });

    it('resets lastAddedProductId after undo', () => {
      const product = makeProduct();
      const { addToCart, undoLastItem } = usePosStore.getState();
      addToCart(product, {});
      expect(usePosStore.getState().lastAddedProductId).toBe(product.id);
      undoLastItem();
      expect(usePosStore.getState().lastAddedProductId).toBeNull();
    });
  });

  describe('setCart', () => {
    it('replaces the entire cart', () => {
      usePosStore.getState().addToCart(makeProduct(), {});
      const newCart = [
        {
          productId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee2',
          name: 'Replaced',
          quantity: 2,
          unitPrice: 30,
          unitPriceUsd: 1,
          subtotal: 60,
          subtotalUsd: 2,
        },
      ];
      usePosStore.getState().setCart(newCart);
      expect(usePosStore.getState().cart).toEqual(newCart);
    });
  });

  describe('setExchangeRate', () => {
    it('updates the exchange rate', () => {
      usePosStore.getState().setExchangeRate(42.5);
      expect(usePosStore.getState().exchangeRate).toBe(42.5);
    });
  });
});
