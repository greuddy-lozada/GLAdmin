'use client';

import { useState, useEffect } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataTable, Column } from '@/components/ui/data-table';
import { SlideForm } from '@/components/ui/slide-form';
import { useExchangeRates } from '@/features/exchange-rates/hooks/use-exchange-rates';
import { ExchangeRateDay, CreateExchangeRateRequest } from '@/features/exchange-rates/models/exchange-rate.model';
import { exchangeRateService } from '@/features/exchange-rates/services/exchange-rate.service';
import { useI18n } from '@/i18n';
import { sileo } from 'sileo';
import { RoleGuard } from '@/components/ui/role-guard';
import apiClient from '@/lib/api/api-client';

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString();
}

export default function ExchangeRatesPage() {
  const { items: exchangeRatesData, isLoading: loading, create, update } = useExchangeRates();
  const { t } = useI18n();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ExchangeRateDay | null>(null);
  const [latestDay, setLatestDay] = useState<ExchangeRateDay | null>(null);
  const [formData, setFormData] = useState<CreateExchangeRateRequest>({});
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');

  const refreshLatest = () => {
    exchangeRateService.getLatest().then(setLatestDay).catch(() => console.warn('Failed to load latest rate'));
  };

  useEffect(() => {
    refreshLatest();
  }, []);

  const columns: Column<ExchangeRateDay>[] = [
    {
      field: 'date',
      headerName: t('exchangeRates.field.date'),
      render: (row) => formatDate(row.date),
    },
    {
      field: 'rateBcvUsd',
      headerName: t('exchangeRates.field.bcv'),
      render: (row) => row.rateBcvUsd?.toFixed(2) ?? '—',
    },
    {
      field: 'rateParalelo',
      headerName: t('exchangeRates.field.paralelo'),
      render: (row) => row.rateParalelo?.toFixed(2) ?? '—',
    },
    {
      field: 'source',
      headerName: t('exchangeRates.field.source'),
      render: (row) => row.source ?? '—',
    },
  ];

  const openCreate = () => {
    setSelectedItem(null);
    setError('');
    setFormData({ date: new Date().toISOString().split('T')[0], source: 'manual' });
    setFormOpen(true);
  };

  const openEdit = (item: ExchangeRateDay) => {
    setSelectedItem(item);
    setError('');
    setFormData({
      rateBcvUsd: item.rateBcvUsd ?? undefined,
      rateParalelo: item.rateParalelo ?? undefined,
      date: item.date ? item.date.split('T')[0] : undefined,
      source: item.source ?? undefined,
    });
    setFormOpen(true);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await apiClient.post('/exchange-rates/sync');
      sileo.success({ description: t('exchangeRates.synced') });
      refreshLatest();
    } catch {
      sileo.error({ description: t('exchangeRates.error.sync') });
    } finally {
      setSyncing(false);
    }
  };

  const handleSave = () => {
    setError('');
    setFormOpen(false);
    if (selectedItem) {
      update.mutate(
        { id: selectedItem.id, data: formData },
        {
          onSuccess: () => {
            sileo.success({ description: t('exchangeRates.updated') });
            refreshLatest();
          },
          onError: () => { setError(t('exchangeRates.error.save')); setFormOpen(true); },
        },
      );
    } else {
      create.mutate(formData, {
        onSuccess: () => {
          sileo.success({ description: t('exchangeRates.created') });
          refreshLatest();
        },
        onError: () => { setError(t('exchangeRates.error.save')); setFormOpen(true); },
      });
    }
    setSelectedItem(null);
  };

  return (
    <SlideForm
      open={formOpen}
      title={selectedItem ? t('exchangeRates.edit') : t('exchangeRates.new')}
      onClose={() => { setFormOpen(false); setSelectedItem(null); }}
      panel={
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('exchangeRates.field.date')}</Label>
            <Input type="date" value={formData.date ?? ''}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>{t('exchangeRates.field.bcv')}</Label>
            <Input type="number" step="0.01" value={formData.rateBcvUsd ?? ''}
              onChange={(e) => setFormData({ ...formData, rateBcvUsd: e.target.value === '' ? undefined : Number(e.target.value) })} />
          </div>
          <div className="space-y-2">
            <Label>{t('exchangeRates.field.paralelo')}</Label>
            <Input type="number" step="0.01" value={formData.rateParalelo ?? ''}
              onChange={(e) => setFormData({ ...formData, rateParalelo: e.target.value === '' ? undefined : Number(e.target.value) })} />
          </div>
          <Button onClick={handleSave} disabled={create.isPending || update.isPending} className="w-full">
            {create.isPending || update.isPending ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      }
    >
      <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {latestDay && (
            <Badge variant="outline" className="text-sm py-1.5 px-3">
              BCV: <strong className="mx-1">{latestDay.rateBcvUsd?.toFixed(2) ?? '—'}</strong>
              &nbsp;|&nbsp; Paralelo: <strong className="mx-1">{latestDay.rateParalelo?.toFixed(2) ?? '—'}</strong>
              <span className="ml-2 text-muted-foreground">({formatDate(latestDay.date)})</span>
            </Badge>
          )}
          <Button size="sm" variant="outline" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`mr-1 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? t('common.loading') : t('exchangeRates.sync')}
          </Button>
        </div>
        <RoleGuard minLevel={40}>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t('exchangeRates.new')}
          </Button>
        </RoleGuard>
      </div>

      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

      <DataTable
        columns={columns}
        rows={exchangeRatesData}
        loading={loading}
        onEdit={(item) => openEdit(item)}
        emptyMessage={t('exchangeRates.empty')}
      />
      </div>
    </SlideForm>
  );
}
