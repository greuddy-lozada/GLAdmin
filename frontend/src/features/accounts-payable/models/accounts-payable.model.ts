export type ApStatusFilter = 'open' | 'paid' | 'overdue' | 'all';

export interface AccountsPayable {
  id: string;
  amount: number;
  credit: number;
  balance: number;
  issueDate: string | null;
  dueDate: string | null;
  status: number;
  createdAt: string;
  purchaseOrderId: string | null;
  purchaseOrderCode: string | null;
  supplierId: string | null;
  supplierName: string;
}

export interface RegisterApPaymentRequest {
  amount: number;
  method?: number;
  note?: string;
}

export const ApStatus = {
  Open: 0,
  Paid: 1,
} as const;
