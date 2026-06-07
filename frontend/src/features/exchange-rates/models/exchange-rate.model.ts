export interface ExchangeRateDay {
  id: number;
  date: string;
  rateBcvUsd: number | null;
  rateParalelo: number | null;
  source: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExchangeRateRequest {
  rateBcvUsd?: number;
  rateParalelo?: number;
  date?: string;
  source?: string;
}

export interface UpdateExchangeRateRequest {
  rateBcvUsd?: number;
  rateParalelo?: number;
  date?: string;
  source?: string;
}
