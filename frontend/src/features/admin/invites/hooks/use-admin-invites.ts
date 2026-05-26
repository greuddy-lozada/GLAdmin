'use client';

import { useState, useCallback, useEffect } from 'react';
import { AdminInvite } from '../models/admin-invite.model';
import { adminInvitesService } from '../services/admin-invites.service';

export function useAdminInvites() {
  const [invites, setInvites] = useState<AdminInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInvites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminInvitesService.getAll();
      setInvites(data);
    } catch {
      setError('Error al cargar invitaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvites();
  }, [loadInvites]);

  return { invites, loading, error, loadInvites };
}
