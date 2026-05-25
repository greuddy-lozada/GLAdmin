export interface ExchangeRate {
  id: number;
  rate: number;
  currencyId?: number | null;
  type: string;
  date: string;
  source?: string | null;
  createdAt: string;
  updatedAt: string;
  currency?: { id: number; code: string; name: string; symbol: string } | null;
}

export interface CreateExchangeRateRequest {
  rate: number;
  currencyId?: number;
  type?: string;
  date?: string;
  source?: string;
}

export interface UpdateExchangeRateRequest {
  rate?: number;
  currencyId?: number;
  type?: string;
  date?: string;
  source?: string;
}
