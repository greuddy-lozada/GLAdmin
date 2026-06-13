'use client';

import { useState, useEffect, useCallback } from 'react';
import { Brand } from '../models/brand.model';
import { brandService } from '../services/brand.service';

export function useBrands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBrands = useCallback(async () => {
    setLoading(true);
    try {
      const data = await brandService.getAll();
      setBrands(data);
    } catch {
      console.warn('Failed to load brands');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBrands(); }, [loadBrands]);

  return { brands, loading, loadBrands };
}
