export interface ForeignExchange {
  id: number;
  value: number;
  idCurrency?: number;
  createdAt: string;
  updatedAt: string;
  currency?: { id: number; code: string; name: string; symbol: string };
}

export interface CreateForeignExchangeRequest {
  value: number;
  idCurrency?: number;
}

export interface UpdateForeignExchangeRequest {
  value?: number;
  idCurrency?: number;
}
