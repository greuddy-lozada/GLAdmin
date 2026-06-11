'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { sileo } from 'sileo';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import { useHotkey } from '@/hooks/use-hotkey';
import { usePosStore } from '@/stores/pos-store';
import { usePos } from './hooks/use-pos';
import { useOfflineSale } from './hooks/use-offline-sale';
import { CustomerSearch } from './components/customer-search';
import { QuickAddCustomer } from './components/quick-add-customer';
import { DetailTable } from './components/detail-table';
import { SaleSummary } from './components/sale-summary';
import { PosToolbar } from './components/pos-toolbar';
import { ParkedOrders } from './components/parked-orders';
import { PaymentModal } from './components/payment-modal';
import { ReceiptDialog } from './components/receipt-dialog';
import { SaleHistory } from './components/sale-history';
import { PaymentMethod } from './models/pos.model';
import type { ParkedOrder } from '@/lib/sync/db';
import { localDb } from '@/lib/sync/db';

export default function PosPage() {
  const { t } = useI18n();
  const {
    cart, products, loadProducts,
    addToCart, removeFromCart, updateQuantity, clearCart,
    total, totalUsd, totalTax, totalTaxUsd,
    withholdingPercentage, withholdingAmount, withholdingAmountUsd,
    netToCollect, netToCollectUsd,
    parkCart, resumeCart, parkRefresh,
    undoLastItem, canUndo,
  } = usePos();

  const customerId = usePosStore(s => s.customerId);
  const customerName = usePosStore(s => s.customerName);
  const customerTaxId = usePosStore(s => s.customerTaxId);
  const exchangeRate = usePosStore(s => s.exchangeRate);
  const setCustomer = usePosStore(s => s.setCustomer);
  const clearCustomer = usePosStore(s => s.clearCustomer);
  const setExchangeRate = usePosStore(s => s.setExchangeRate);

  const { createSale } = useOfflineSale();
  const [receipt, setReceipt] = useState<{ open: boolean; code: string; itemCount: number; total: number; totalUsd: number }>({ open: false, code: '', itemCount: 0, total: 0, totalUsd: 0 });
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddKey, setQuickAddKey] = useState(0);

  const openQuickAdd = () => {
    setQuickAddKey(k => k + 1);
    setQuickAddOpen(true);
  };

  const productSearchRef = useRef<HTMLInputElement>(null);
  const customerSearchRef = useRef<HTMLInputElement>(null);

  const barcodeBuffer = useRef('');
  const barcodeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    loadProducts();
    localDb.exchangeRateDays.orderBy('updatedAt').last().then((day) => {
      if (day) setExchangeRate(day.rateBcvUsd ?? day.rateParalelo ?? 0);
    }).catch(() => {
      localDb.exchangeRates.orderBy('updatedAt').last().then((rate) => { if (rate) setExchangeRate(rate.rate); }).catch(console.warn);
    });
  }, []);

  const handlePark = async () => {
    const result = await parkCart(customerId, customerName);
    if (result.error) {
      sileo.error({ description: t('pos.park.error.park') });
    } else {
      sileo.success({ description: `${result.label} en espera` });
      clearCustomer();
    }
  };

  const handleCloseModal = () => {
    setReceipt(prev => ({ ...prev, open: false }));
    setPaymentOpen(false);
  };

  useHotkey('pos.searchProduct', () => productSearchRef.current?.focus());
  useHotkey('pos.searchCustomer', () => customerSearchRef.current?.focus());
  useHotkey('pos.parkOrder', handlePark);
  useHotkey('pos.payment', () => setPaymentOpen(true));
  useHotkey('pos.undo', undoLastItem);
  useHotkey('pos.refreshProducts', loadProducts);
  useHotkey('pos.closeModal', handleCloseModal);
  useHotkey('pos.quickAddCustomer', openQuickAdd);

  const handlePayment = async (paymentMethod: PaymentMethod) => {
    const saleCode = `SALE-${Date.now()}`;
    await createSale(cart, total, totalUsd, exchangeRate, paymentMethod, customerId, withholdingPercentage, withholdingAmount, withholdingAmountUsd);
    setReceipt({ open: true, code: saleCode, itemCount: cart.length, total, totalUsd });
    clearCart();
    clearCustomer();
    setPaymentOpen(false);
  };

  const handleResume = (order: ParkedOrder) => {
    resumeCart(order);
  };

  const handleQuickAddCustomer = (customer: { id: number; name: string; taxId: string; isWithholdingAgent: boolean; withholdingPercentage?: number | null; withholdingProof?: string }) => {
    setCustomer(customer.id, customer.name, customer.taxId, customer.isWithholdingAgent ? customer.withholdingPercentage ?? null : null);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key.length === 1 && e.key !== 'Enter') {
        clearTimeout(barcodeTimer.current);
        barcodeBuffer.current += e.key;
        barcodeTimer.current = setTimeout(() => { barcodeBuffer.current = ''; }, 200);
      }
      if (e.key === 'Enter' && barcodeBuffer.current.length >= 3) {
        const product = products.find(p => p.code === barcodeBuffer.current);
        if (product) { addToCart(product); barcodeBuffer.current = ''; e.preventDefault(); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [products, addToCart]);

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <Suspense fallback={<div className="flex items-center justify-center h-64"><p className="text-muted-foreground">{t('pos.loading')}</p></div>}>
        <PosToolbar exchangeRate={exchangeRate} onPark={handlePark} onUndo={undoLastItem} canUndo={canUndo} hasItems={cart.length > 0} />

        <div className="flex items-center gap-2 mb-4">
          <CustomerSearch
            ref={customerSearchRef}
            value={customerId}
            onChange={(id, name, taxId, withholdingPct) => setCustomer(id, name, taxId, withholdingPct)}
          />
          <QuickAddCustomer key={quickAddKey} open={quickAddOpen} onOpenChange={setQuickAddOpen} onCreated={handleQuickAddCustomer} />
        </div>

        <DetailTable ref={productSearchRef} items={cart} onAddToCart={addToCart} onUpdateQuantity={updateQuantity} onRemove={removeFromCart} />

        <SaleSummary total={total} totalUsd={totalUsd} totalTax={totalTax} totalTaxUsd={totalTaxUsd} exchangeRate={exchangeRate} withholdingPercentage={withholdingPercentage} withholdingAmount={withholdingAmount} withholdingAmountUsd={withholdingAmountUsd} netToCollect={netToCollect} netToCollectUsd={netToCollectUsd} />

        <div className="mt-4">
          <Button className="w-full" size="lg" onClick={() => setPaymentOpen(true)} disabled={cart.length === 0}>
            {t('pos.payment.checkout')}
          </Button>
        </div>

        <ParkedOrders currentCartCount={cart.length} onResume={handleResume} refreshTrigger={parkRefresh} />

        <SaleHistory />
      </Suspense>

      <PaymentModal open={paymentOpen} onOpenChange={setPaymentOpen} total={total} totalUsd={totalUsd} withholdingAmount={withholdingAmount} withholdingAmountUsd={withholdingAmountUsd} netToCollect={netToCollect} netToCollectUsd={netToCollectUsd} onPayment={handlePayment} />
      <ReceiptDialog open={receipt.open} onClose={() => setReceipt(prev => ({ ...prev, open: false }))} saleCode={receipt.code} itemCount={receipt.itemCount} total={receipt.total} totalUsd={receipt.totalUsd} />
    </div>
  );
}
