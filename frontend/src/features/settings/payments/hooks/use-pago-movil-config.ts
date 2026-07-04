'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreatePagoMovilConfigRequest, UpdatePagoMovilConfigRequest } from '../models/pago-movil-config.model';
import { pagoMovilConfigService } from '../services/pago-movil-config.service';

export function usePagoMovilConfig() {
  const queryClient = useQueryClient();

  const { data: config = null, isLoading: loading, error } = useQuery({
    queryKey: ['pagoMovilConfig'],
    queryFn: () => pagoMovilConfigService.get(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreatePagoMovilConfigRequest) => pagoMovilConfigService.create(data),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['pagoMovilConfig'] }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdatePagoMovilConfigRequest) => pagoMovilConfigService.update(data),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['pagoMovilConfig'] }),
  });

  const deactivateMutation = useMutation({
    mutationFn: () => pagoMovilConfigService.deactivate(),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['pagoMovilConfig'] }),
  });

  return {
    config,
    loading,
    error: error ? 'Error al cargar configuración' : null,
    create: { mutate: createMutation.mutate, isPending: createMutation.isPending },
    update: { mutate: updateMutation.mutate, isPending: updateMutation.isPending },
    deactivate: { mutate: deactivateMutation.mutate, isPending: deactivateMutation.isPending },
  };
}
