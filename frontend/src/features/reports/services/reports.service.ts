import apiClient from '@/lib/api/api-client';
import {
  GeneratedReport,
  ReportType,
  ReportListResponse,
  generatedReportSchema,
  reportTypeSchema,
} from '../models/report.model';

export const reportsService = {
  async generate(type: string, parameters: Record<string, unknown>): Promise<GeneratedReport> {
    const response = await apiClient.post('/reports', { type, parameters });
    return generatedReportSchema.parse(response.data.data);
  },

  async getAll(params?: {
    page?: number;
    limit?: number;
    category?: string;
    type?: string;
  }): Promise<ReportListResponse> {
    const response = await apiClient.get('/reports', { params });
    return response.data as ReportListResponse;
  },

  async getById(id: string): Promise<GeneratedReport> {
    const response = await apiClient.get(`/reports/${id}`);
    return generatedReportSchema.parse(response.data.data);
  },

  async getTypes(): Promise<ReportType[]> {
    const response = await apiClient.get('/reports/types');
    return reportTypeSchema.array().parse(response.data.data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/reports/${id}`);
  },
};
