export interface CashRegister {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterSession {
  id: string;
  cashRegisterId: string;
  userId: string;
  organizationId: string;
  initialCash: number;
  initialCashUsd: number;
  status: 'open' | 'closed';
  openedAt: string;
  closedAt: string | null;
  notes: string | null;
  cashRegister?: { id: string; name: string; code: string };
  createdAt: string;
  updatedAt: string;
}

export interface RegisterSettlement {
  id: string;
  sessionId: string;
  expectedCash: number;
  countedCash: number;
  difference: number;
  closedById: string;
  notes: string | null;
  closedAt: string;
  session?: RegisterSession & { cashRegister?: { id: string; name: string; code: string } };
}

export interface CreateCashRegisterRequest {
  name: string;
  code: string;
}

export interface UpdateCashRegisterRequest {
  name?: string;
  code?: string;
  isActive?: boolean;
}

export interface OpenRegisterRequest {
  initialCash: number;
  initialCashUsd?: number;
  notes?: string;
}

export interface CloseRegisterRequest {
  countedCash: number;
  notes?: string;
}
