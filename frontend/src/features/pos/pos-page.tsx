'use client';

import { useEffect } from 'react';
import { usePos } from './hooks/use-pos';
import { useOfflineSale } from './hooks/use-offline-sale';
import { ProductGrid } from './components/product-grid';
import { Cart } from './components/cart';
import { PaymentModal } from './components/payment-modal';

export default function PosPage() {
  const {
    cart,
    products,
    loadProducts,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    total,
    totalUsd,
  } = usePos();

  const { createSale } = useOfflineSale();

  useEffect(() => {
    loadProducts();
  }, []);

  const handlePayment = async (paymentMethod: number) => {
    await createSale(cart, total, totalUsd, 50, paymentMethod);
    clearCart();
    alert('Sale completed!');
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Point of Sale</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProductGrid products={products} onAddToCart={addToCart} />
        </div>
        <div className="space-y-4">
          <Cart
            items={cart}
            onUpdateQuantity={updateQuantity}
            onRemove={removeFromCart}
            total={total}
            totalUsd={totalUsd}
          />
          <PaymentModal total={total} totalUsd={totalUsd} onPayment={handlePayment} />
        </div>
      </div>
    </div>
  );
}
