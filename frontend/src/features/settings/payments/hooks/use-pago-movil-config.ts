'use client';

import { useState, useCallback, useEffect } from 'react';
import { PagoMovilConfig, CreatePagoMovilConfigRequest, UpdatePagoMovilConfigRequest } from '../models/pago-movil-config.model';
import { pagoMovilConfigService } from '../services/pago-movil-config.service';

export function usePagoMovilConfig() {
  const [config, setConfig] = useState<PagoMovilConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await pagoMovilConfigService.get();
      setConfig(data);
    } catch {
      setError('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const createConfig = useCallback(async (data: CreatePagoMovilConfigRequest) => {
    setLoading(true);
    try {
      const result = await pagoMovilConfigService.create(data);
      setConfig(result);
      return true;
    } catch {
      setError('Error al guardar configuración');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateConfig = useCallback(async (data: UpdatePagoMovilConfigRequest) => {
    setLoading(true);
    try {
      const result = await pagoMovilConfigService.update(data);
      setConfig(result);
      return true;
    } catch {
      setError('Error al actualizar configuración');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const deactivateConfig = useCallback(async () => {
    setLoading(true);
    try {
      await pagoMovilConfigService.deactivate();
      setConfig(null);
      return true;
    } catch {
      setError('Error al desactivar configuración');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { config, loading, error, loadConfig, createConfig, updateConfig, deactivateConfig };
}
