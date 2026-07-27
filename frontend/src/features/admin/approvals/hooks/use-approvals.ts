'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminApproval } from '../models/approval.model';
import { adminApprovalsService } from '../services/approvals.service';

export function useApprovals() {
  const [items, setItems] = useState<AdminApproval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminApprovalsService.getAll(statusFilter);
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const approve = async (id: string) => {
    await adminApprovalsService.approve(id);
    await load();
  };

  const reject = async (id: string, reason?: string) => {
    await adminApprovalsService.reject(id, reason);
    await load();
  };

  return { items, isLoading, statusFilter, setStatusFilter, approve, reject, refresh: load };
}
