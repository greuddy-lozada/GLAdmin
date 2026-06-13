'use client';

import { useState, useEffect, useCallback } from 'react';
import { Category } from '../models/category.model';
import { categoryService } from '../services/category.service';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch {
      console.warn('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  return { categories, loading, loadCategories };
}
