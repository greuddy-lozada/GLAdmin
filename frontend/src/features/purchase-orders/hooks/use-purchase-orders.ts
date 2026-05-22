'use client';

import { useState, useCallback, useEffect } from 'react';
import { PurchaseOrder, CreatePurchaseOrderRequest, UpdatePurchaseOrderRequest } from '../models/purchase-order.model';
import { purchaseOrderService } from '../services/purchase-order.service';

export function usePurchaseOrders() {
  const [items, setItems] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await purchaseOrderService.getAll();
      setItems(data);
    } catch {
      setError('Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const createItem = useCallback(async (data: CreatePurchaseOrderRequest) => {
    setLoading(true);
    try {
      await purchaseOrderService.create(data);
      await loadItems();
      return true;
    } catch {
      setError('Error al crear pedido');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadItems]);

  const updateItem = useCallback(async (id: number, data: UpdatePurchaseOrderRequest) => {
    setLoading(true);
    try {
      await purchaseOrderService.update(id, data);
      await loadItems();
      return true;
    } catch {
      setError('Error al actualizar pedido');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadItems]);

  const deleteItem = useCallback(async (id: number) => {
    setLoading(true);
    try {
      await purchaseOrderService.delete(id);
      await loadItems();
      return true;
    } catch {
      setError('Error al eliminar pedido');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadItems]);

  return { items, loading, error, loadItems, createItem, updateItem, deleteItem };
}
