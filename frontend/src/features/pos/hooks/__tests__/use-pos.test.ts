import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePosStore } from '@/stores/pos-store';
import { usePos } from '@/features/pos/hooks/use-pos';

const { mockTaxesToArray, mockProductsGet, mockParkedOrdersAdd } = vi.hoisted(() => ({
  mockTaxesToArray: vi.fn(),
  mockProductsGet: vi.fn(),
  mockParkedOrdersAdd: vi.fn(),
}));

vi.mock('@/lib/sync/db', () => ({
  localDb: {
    taxes: { toArray: mockTaxesToArray },
    products: { get: mockProductsGet },
    parkedOrders: { add: mockParkedOrdersAdd },
  },
}));

vi.mock('sileo', () => ({
  sileo: { error: vi.fn(), warning: vi.fn(), success: vi.fn() },
}));

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

const makeProduct = (overrides = {}) => ({
  id: '2e4f7a92-8012-49f5-b5a6-1c7e5d8f3a91',
  organizationId: 'org-1',
  name: 'Test Product',
  price: 100,
  stock: 10,
  margin: 20,
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

const renderPos = () => renderHook(() => usePos());

describe('usePos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
    mockTaxesToArray.mockReturnValue({
      then: (resolve: (value: unknown) => void) => {
        resolve([{ id: 'tax-1', name: 'IVA', percentage: 16 }]);
        return { catch: vi.fn() };
      },
      catch: vi.fn(),
    });
    mockParkedOrdersAdd.mockResolvedValue(undefined);
  });

  describe('initial state', () => {
    it('has empty cart and zero totals', () => {
      const { result } = renderPos();
      expect(result.current.cart).toEqual([]);
      expect(result.current.total).toBe(0);
      expect(result.current.totalTax).toBe(0);
      expect(result.current.withholdingAmount).toBe(0);
      expect(result.current.netToCollect).toBe(0);
    });

    it('canUndo is false when cart is empty', () => {
      const { result } = renderPos();
      expect(result.current.canUndo).toBe(false);
    });
  });

  describe('addToCart', () => {
    it('adds product to cart and enables undo', () => {
      const product = makeProduct();
      const { result } = renderPos();

      act(() => {
        result.current.addToCart(product);
      });

      expect(result.current.cart).toHaveLength(1);
      expect(result.current.cart[0].name).toBe(product.name);
      expect(result.current.canUndo).toBe(true);
    });

    it('increments quantity on duplicate product add', () => {
      const product = makeProduct();
      const { result } = renderPos();

      act(() => {
        result.current.addToCart(product);
        result.current.addToCart(product);
      });

      expect(result.current.cart).toHaveLength(1);
      expect(result.current.cart[0].quantity).toBe(2);
    });

    it('updates computed totals after adding', () => {
      const product = makeProduct({ price: 150 });
      const { result } = renderPos();

      act(() => {
        result.current.addToCart(product);
      });

      expect(result.current.total).toBe(150);
    });
  });

  describe('removeFromCart', () => {
    it('removes product from cart', () => {
      const product = makeProduct();
      const { result } = renderPos();

      act(() => {
        result.current.addToCart(product);
      });
      act(() => {
        result.current.removeFromCart(product.id);
      });

      expect(result.current.cart).toHaveLength(0);
    });

    it('updates total to 0 after removing last item', () => {
      const product = makeProduct();
      const { result } = renderPos();

      act(() => {
        result.current.addToCart(product);
      });
      act(() => {
        result.current.removeFromCart(product.id);
      });

      expect(result.current.total).toBe(0);
    });
  });

  describe('updateQuantity', () => {
    it('fetches product stock from localDb and updates quantity', async () => {
      mockProductsGet.mockResolvedValue(makeProduct({ stock: 5 }));
      const product = makeProduct();
      const { result } = renderPos();

      act(() => {
        result.current.addToCart(product);
      });
      await act(async () => {
        await result.current.updateQuantity(product.id, 3);
      });

      expect(mockProductsGet).toHaveBeenCalledWith(product.id);
      expect(result.current.cart[0].quantity).toBe(3);
    });

    it('removes item when quantity is set to 0', async () => {
      mockProductsGet.mockResolvedValue(makeProduct());
      const product = makeProduct();
      const { result } = renderPos();

      act(() => {
        result.current.addToCart(product);
      });
      await act(async () => {
        await result.current.updateQuantity(product.id, 0);
      });

      expect(result.current.cart).toHaveLength(0);
    });

    it('passes product stock to store for validation', async () => {
      mockProductsGet.mockResolvedValue(makeProduct({ stock: 2 }));
      const product = makeProduct();
      const { result } = renderPos();

      act(() => {
        result.current.addToCart(product);
      });
      await act(async () => {
        await result.current.updateQuantity(product.id, 10);
      });

      expect(result.current.cart[0].quantity).toBe(1);
    });
  });

  describe('clearCart', () => {
    it('empties the cart', () => {
      const { result } = renderPos();

      act(() => {
        result.current.addToCart(makeProduct());
        result.current.addToCart(makeProduct({ id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee2' }));
      });
      act(() => {
        result.current.clearCart();
      });

      expect(result.current.cart).toHaveLength(0);
      expect(result.current.total).toBe(0);
    });
  });

  describe('computed totals', () => {
    it('calculates total as sum of all subtotals', () => {
      act(() => {
        usePosStore.setState({
          cart: [
            { productId: 'p1', name: 'A', quantity: 2, unitPrice: 50, unitPriceUsd: 0, subtotal: 100, subtotalUsd: 0 },
            { productId: 'p2', name: 'B', quantity: 1, unitPrice: 200, unitPriceUsd: 0, subtotal: 200, subtotalUsd: 0 },
          ],
        });
      });
      const { result } = renderPos();

      expect(result.current.total).toBe(300);
    });

    it('calculates totalTax from item tax amounts', () => {
      act(() => {
        usePosStore.setState({
          cart: [
            { productId: 'p1', name: 'A', quantity: 1, unitPrice: 100, unitPriceUsd: 0, subtotal: 100, subtotalUsd: 0, taxAmount: 16 },
            { productId: 'p2', name: 'B', quantity: 2, unitPrice: 50, unitPriceUsd: 0, subtotal: 100, subtotalUsd: 0, taxAmount: 8 },
          ],
        });
      });
      const { result } = renderPos();

      expect(result.current.totalTax).toBe(24);
    });

    it('calculates withholdingAmount based on withholdingPercentage and totalTax', () => {
      act(() => {
        usePosStore.setState({
          cart: [
            { productId: 'p1', name: 'A', quantity: 1, unitPrice: 1000, unitPriceUsd: 0, subtotal: 1000, subtotalUsd: 0, taxAmount: 160 },
          ],
          withholdingPercentage: 10,
        });
      });
      const { result } = renderPos();

      expect(result.current.withholdingAmount).toBeCloseTo(16);
      expect(result.current.netToCollect).toBeCloseTo(1144);
    });

    it('withholdingAmount is 0 when totalTax is 0', () => {
      act(() => {
        usePosStore.setState({
          cart: [
            { productId: 'p1', name: 'A', quantity: 1, unitPrice: 100, unitPriceUsd: 0, subtotal: 100, subtotalUsd: 0 },
          ],
          withholdingPercentage: 10,
        });
      });
      const { result } = renderPos();

      expect(result.current.withholdingAmount).toBe(0);
      expect(result.current.netToCollect).toBe(100);
    });

    it('withholdingAmount is 0 when withholdingPercentage is null', () => {
      act(() => {
        usePosStore.setState({
          cart: [
            { productId: 'p1', name: 'A', quantity: 1, unitPrice: 1000, unitPriceUsd: 0, subtotal: 1000, subtotalUsd: 0, taxAmount: 160 },
          ],
          withholdingPercentage: null,
        });
      });
      const { result } = renderPos();

      expect(result.current.withholdingAmount).toBe(0);
      expect(result.current.netToCollect).toBe(1160);
    });
  });

  describe('undoLastItem', () => {
    it('removes last added item from cart', () => {
      const { result } = renderPos();

      act(() => {
        result.current.addToCart(makeProduct());
      });
      act(() => {
        result.current.undoLastItem();
      });

      expect(result.current.cart).toHaveLength(0);
      expect(result.current.canUndo).toBe(false);
    });

    it('decrements quantity when last item has qty > 1', () => {
      const { result } = renderPos();

      act(() => {
        result.current.addToCart(makeProduct());
        result.current.addToCart(makeProduct());
      });
      act(() => {
        result.current.undoLastItem();
      });

      expect(result.current.cart).toHaveLength(1);
      expect(result.current.cart[0].quantity).toBe(1);
    });
  });

  describe('parkCart', () => {
    it('saves parked order to localDb and clears cart', async () => {
      const product = makeProduct();
      const { result } = renderPos();

      act(() => {
        result.current.addToCart(product);
      });

      let parkResult: { label: string; error?: string } = { label: '' };
      await act(async () => {
        parkResult = await result.current.parkCart(
          'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1',
          'John',
        );
      });

      expect(mockParkedOrdersAdd).toHaveBeenCalledTimes(1);
      const savedOrder = mockParkedOrdersAdd.mock.calls[0][0];
      expect(savedOrder.cartItems).toHaveLength(1);
      expect(savedOrder.customerId).toBe('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1');
      expect(savedOrder.customerName).toBe('John');
      expect(result.current.cart).toHaveLength(0);
      expect(parkResult.label).toMatch(/^Orden #/);
      expect(parkResult.error).toBeUndefined();
    });

    it('returns error when cart is empty', async () => {
      const { result } = renderPos();

      let parkResult: { label: string; error?: string } = { label: '' };
      await act(async () => {
        parkResult = await result.current.parkCart();
      });

      expect(mockParkedOrdersAdd).not.toHaveBeenCalled();
      expect(parkResult.error).toBe('empty');
    });

    it('increments parkRefresh after successful park', async () => {
      const { result } = renderPos();

      act(() => {
        result.current.addToCart(makeProduct());
      });

      expect(result.current.parkRefresh).toBe(0);
      await act(async () => {
        await result.current.parkCart();
      });
      expect(result.current.parkRefresh).toBe(1);
    });
  });

  describe('resumeCart', () => {
    it('sets cart from parked order items', () => {
      const { result } = renderPos();
      const cartItems = [
        { productId: 'p1', name: 'A', quantity: 1, unitPrice: 50, unitPriceUsd: 0, subtotal: 50, subtotalUsd: 0 },
      ];

      act(() => {
        result.current.resumeCart({ cartItems });
      });

      expect(result.current.cart).toEqual(cartItems);
    });

    it('merges with existing cart items', () => {
      const { result } = renderPos();

      act(() => {
        result.current.addToCart(makeProduct({ id: 'p1', name: 'A', price: 100 }));
      });

      const cartItems = [
        { productId: 'p1', name: 'A', quantity: 2, unitPrice: 50, unitPriceUsd: 0, subtotal: 100, subtotalUsd: 0 },
        { productId: 'p2', name: 'B', quantity: 1, unitPrice: 80, unitPriceUsd: 0, subtotal: 80, subtotalUsd: 0 },
      ];

      act(() => {
        result.current.resumeCart({ cartItems });
      });

      const merged = result.current.cart.find(i => i.productId === 'p1');
      expect(merged!.quantity).toBe(3);
      expect(merged!.unitPrice).toBe(100);
      expect(merged!.subtotal).toBe(300);
      expect(result.current.cart).toHaveLength(2);
    });
  });
});
