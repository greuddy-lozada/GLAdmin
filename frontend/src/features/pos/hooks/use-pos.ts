import { useState } from 'react';
import { localDb } from '@/lib/sync/db';

export interface CartItem {
  productId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  unitPriceUsd: number;
  subtotal: number;
  subtotalUsd: number;
}

export function usePos() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const loadProducts = async () => {
    const allProducts = await localDb.products.toArray();
    setProducts(allProducts);
  };

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.productId === product.id
          ? {
              ...item,
              quantity: item.quantity + 1,
              subtotal: (item.quantity + 1) * item.unitPrice,
              subtotalUsd: (item.quantity + 1) * item.unitPriceUsd,
            }
          : item
      ));
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          name: product.name,
          quantity: 1,
          unitPrice: product.price,
          unitPriceUsd: product.priceUsd || 0,
          subtotal: product.price,
          subtotalUsd: product.priceUsd || 0,
        },
      ]);
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(cart.map(item =>
      item.productId === productId
        ? {
            ...item,
            quantity,
            subtotal: quantity * item.unitPrice,
            subtotalUsd: quantity * item.unitPriceUsd,
          }
        : item
    ));
  };

  const clearCart = () => {
    setCart([]);
  };

  const total = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const totalUsd = cart.reduce((sum, item) => sum + item.subtotalUsd, 0);

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
  };
}
