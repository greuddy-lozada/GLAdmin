export type ArStatusFilter = 'open' | 'paid' | 'overdue' | 'all';

export interface AccountsReceivable {
  id: string;
  amount: number;
  credit: number;
  balance: number;
  issueDate: string | null;
  dueDate: string | null;
  status: number;
  createdAt: string;
  saleId: string | null;
  saleCode: string | null;
  customerId: string | null;
  customerName: string;
}

export interface RegisterArPaymentRequest {
  amount: number;
  method?: number;
  note?: string;
}

export const ArStatus = {
  Open: 0,
  Paid: 1,
} as const;
