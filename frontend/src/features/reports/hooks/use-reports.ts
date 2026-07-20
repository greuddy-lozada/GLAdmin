'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsService } from '../services/reports.service';

export function useReports(params?: {
  page?: number;
  limit?: number;
  category?: string;
}) {
  return useQuery({
    queryKey: ['reports', params],
    queryFn: () => reportsService.getAll(params),
  });
}

export function useReport(id: string) {
  return useQuery({
    queryKey: ['reports', id],
    queryFn: () => reportsService.getById(id),
  });
}

export function useReportTypes() {
  return useQuery({
    queryKey: ['reports', 'types'],
    queryFn: () => reportsService.getTypes(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useGenerateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ type, parameters }: { type: string; parameters: Record<string, unknown> }) =>
      reportsService.generate(type, parameters),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => reportsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}
