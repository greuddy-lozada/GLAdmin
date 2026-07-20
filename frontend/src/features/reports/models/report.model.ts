import { z } from 'zod';

export interface ParamField {
  key: string;
  label: string;
  type: 'date' | 'dateRange' | 'select' | 'multiSelect' | 'number';
  required: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: unknown;
}

export interface ReportType {
  type: string;
  category: 'sales' | 'inventory' | 'fiscal' | 'financial';
  name: string;
  description: string;
  parameters: ParamField[];
}

export interface GeneratedReport {
  id: string;
  type: string;
  category: string;
  name: string;
  parameters: Record<string, unknown>;
  results: Record<string, unknown> | null;
  status: 'generating' | 'ready' | 'failed';
  errorMessage: string | null;
  userName: string | null;
  generatedAt: string | null;
  createdAt: string;
}

export interface ReportListResponse {
  data: GeneratedReport[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const generatedReportSchema = z.object({
  id: z.string(),
  type: z.string(),
  category: z.string(),
  name: z.string(),
  parameters: z.record(z.string(), z.unknown()),
  results: z.record(z.string(), z.unknown()).nullable(),
  status: z.enum(['generating', 'ready', 'failed']),
  errorMessage: z.string().nullable(),
  userName: z.string().nullable(),
  generatedAt: z.string().nullable(),
  createdAt: z.string(),
});

export const reportTypeSchema = z.object({
  type: z.string(),
  category: z.enum(['sales', 'inventory', 'fiscal', 'financial']),
  name: z.string(),
  description: z.string(),
  parameters: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      type: z.enum(['date', 'dateRange', 'select', 'multiSelect', 'number']),
      required: z.boolean(),
      options: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
      defaultValue: z.unknown().optional(),
    }),
  ),
});
