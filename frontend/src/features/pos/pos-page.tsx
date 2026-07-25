'use client';

import { useEffect, useState, useRef } from 'react';
import { sileo } from 'sileo';
import { useI18n } from '@/i18n';
import { useHotkey } from '@/hooks/use-hotkey';
import { usePosStore } from '@/stores/pos-store';
import { usePos } from './hooks/use-pos';
import { useOfflineSale } from './hooks/use-offline-sale';
import { PosToolbar } from './components/pos-toolbar';
import { CustomerBar } from './components/customer-bar';
import { QuickAddCustomer } from './components/quick-add-customer';
import { ProductGrid, type ProductGridHandle } from './components/product-grid';
import { CartPanel } from './components/cart-panel';
import { ParkedOrders } from './components/parked-orders';
import { PaymentModal } from './components/payment-modal';
import { ReceiptDialog } from './components/receipt-dialog';
import { SaleHistory } from './components/sale-history';
import { SaleDetailModal } from './components/sale-detail-modal';
import { PaymentMethod, type SalePayment } from './models/pos.model';
import type { CartItem } from './models/pos.model';
import type { ParkedOrder, LocalSale } from '@/lib/sync/db';
import { localDb } from '@/lib/sync/db';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface ReceiptData {
  open: boolean;
  code: string;
  items: CartItem[];
  total: number;
  totalUsd: number;
  customerName?: string;
  customerTaxId?: string;
  payments: SalePayment[];
  exchangeRate: number;
}

export default function PosPage() {
  const { t } = useI18n();
  const {
    cart, addToCart, removeFromCart, updateQuantity, clearCart,
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
  const [receipt, setReceipt] = useState<ReceiptData>({ open: false, code: '', items: [], total: 0, totalUsd: 0, payments: [], exchangeRate: 0 });
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddKey, setQuickAddKey] = useState(0);
  const [gridRefresh, setGridRefresh] = useState(0);
  const [detailSale, setDetailSale] = useState<LocalSale | null>(null);
  const [parkedSheetOpen, setParkedSheetOpen] = useState(false);
  const [historySheetOpen, setHistorySheetOpen] = useState(false);
  const [parkedCount, setParkedCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      const count = await localDb.parkedOrders.count();
      setParkedCount(count);
    };
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [parkRefresh]);

  const productGridRef = useRef<ProductGridHandle>(null);
  const customerSearchRef = useRef<HTMLInputElement>(null);

  const openQuickAdd = () => {
    setQuickAddKey(k => k + 1);
    setQuickAddOpen(true);
  };

  const barcodeBuffer = useRef('');
  const barcodeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    localDb.exchangeRateDays.orderBy('updatedAt').last().then((day) => {
      if (day) setExchangeRate(day.rateBcvUsd ?? day.rateParalelo ?? 0);
    }).catch(() => {
      localDb.exchangeRates.orderBy('updatedAt').last().then((rate) => { if (rate) setExchangeRate(rate.rate); }).catch(console.warn);
    });
  }, [setExchangeRate]);

  const handlePark = async () => {
    const result = await parkCart(customerId, customerName);
    if (result.error) {
      sileo.error({ description: t('pos.park.error.park') });
    } else {
      sileo.success({ description: `${result.label} en espera` });
      clearCustomer();
    }
  };

  const handleClearCart = () => {
    if (cart.length > 0) clearCart();
  };

  const handleCloseModal = () => {
    setReceipt(prev => ({ ...prev, open: false }));
    setPaymentOpen(false);
    setQuickAddOpen(false);
  };

  useHotkey('pos.searchProduct', () => productGridRef.current?.focusSearch());
  useHotkey('pos.searchCustomer', () => customerSearchRef.current?.focus());
  useHotkey('pos.clearCustomer', () => clearCustomer());
  useHotkey('pos.clearCart', handleClearCart);
  useHotkey('pos.refreshProducts', () => setGridRefresh(n => n + 1));
  useHotkey('pos.parkOrder', handlePark);
  useHotkey('pos.payment', () => setPaymentOpen(true));
  useHotkey('pos.undo', undoLastItem);
  useHotkey('pos.closeModal', handleCloseModal);
  useHotkey('pos.quickAddCustomer', openQuickAdd);

  const handlePayment = async (payments: SalePayment[]) => {
    const primaryMethod = payments.length === 1 ? payments[0].method : PaymentMethod.Mixed;
    const saleCode = await createSale(cart, total, totalUsd, exchangeRate, primaryMethod, customerId, withholdingPercentage, withholdingAmount, withholdingAmountUsd, payments);
    setReceipt({ open: true, code: saleCode, items: [...cart], total, totalUsd, customerName, customerTaxId, payments, exchangeRate });
    clearCart();
    clearCustomer();
    setPaymentOpen(false);
  };

  const handleResume = (order: ParkedOrder) => {
    resumeCart(order);
  };

  const handleQuickAddCustomer = (customer: { id: string; name: string; taxId: string; isWithholdingAgent: boolean; withholdingPercentage?: number | null }) => {
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
        const code = barcodeBuffer.current;
        localDb.products.filter(p => p.code === code).first().then(product => {
          if (product) { addToCart(product); barcodeBuffer.current = ''; e.preventDefault(); }
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [addToCart]);

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-8rem)] pb-6">
      <PosToolbar exchangeRate={exchangeRate} onPark={handlePark} onUndo={undoLastItem} canUndo={canUndo} hasItems={cart.length > 0} onOpenParked={() => setParkedSheetOpen(true)} onOpenHistory={() => setHistorySheetOpen(true)} parkedCount={parkedCount} />

      <CustomerBar
        ref={customerSearchRef}
        customerId={customerId}
        customerName={customerName}
        customerTaxId={customerTaxId}
        withholdingPercentage={withholdingPercentage}
        onSelectCustomer={(id, name, taxId, withholding) => setCustomer(id, name, taxId, withholding)}
        onClearCustomer={clearCustomer}
        onQuickAdd={openQuickAdd}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4 flex-1 min-h-0">
        <div className="lg:col-span-2 h-full min-h-0 flex flex-col">
          <div className="flex-1 overflow-y-auto pr-1 min-h-0">
            <ProductGrid ref={productGridRef} onAddToCart={addToCart} refreshTrigger={gridRefresh} />
          </div>
        </div>

        <div className="lg:col-span-1 flex flex-col min-h-0">
          <div className="flex-1 min-h-0">
            <CartPanel
              items={cart}
              onUpdateQuantity={updateQuantity}
              onRemove={removeFromCart}
              total={total}
              totalUsd={totalUsd}
              totalTax={totalTax}
              totalTaxUsd={totalTaxUsd}
              exchangeRate={exchangeRate}
              withholdingPercentage={withholdingPercentage}
              withholdingAmount={withholdingAmount}
              netToCollect={netToCollect}
              onCheckout={() => setPaymentOpen(true)}
            />
          </div>
        </div>
    </div>

      <Sheet open={parkedSheetOpen} onOpenChange={setParkedSheetOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{t('pos.park.title')}</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <ParkedOrders variant="sheet" currentCartCount={cart.length} onResume={handleResume} refreshTrigger={parkRefresh} />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={historySheetOpen} onOpenChange={setHistorySheetOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{t('pos.sales.title')}</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <SaleHistory variant="sheet" onSelectSale={(sale) => { setDetailSale(sale); setHistorySheetOpen(false); }} />
          </div>
        </SheetContent>
      </Sheet>

      <PaymentModal
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        total={total}
        totalUsd={totalUsd}
        totalTax={totalTax}
        totalTaxUsd={totalTaxUsd}
        exchangeRate={exchangeRate}
        withholdingAmount={withholdingAmount}
        withholdingAmountUsd={withholdingAmountUsd}
        netToCollect={netToCollect}
        netToCollectUsd={netToCollectUsd}
        onPayment={handlePayment}
      />

      <ReceiptDialog
        open={receipt.open}
        onClose={() => setReceipt(prev => ({ ...prev, open: false }))}
        code={receipt.code}
        items={receipt.items}
        total={receipt.total}
        totalUsd={receipt.totalUsd}
        customerName={receipt.customerName}
        customerTaxId={receipt.customerTaxId}
        payments={receipt.payments}
        exchangeRate={receipt.exchangeRate}
      />
    </div>

    <QuickAddCustomer key={quickAddKey} open={quickAddOpen} onOpenChange={setQuickAddOpen} onCreated={handleQuickAddCustomer} />
    <SaleDetailModal sale={detailSale} open={detailSale !== null} onOpenChange={(o) => !o && setDetailSale(null)} />
    </>
  );
}
