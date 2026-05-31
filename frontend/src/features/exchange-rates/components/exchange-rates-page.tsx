'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataTable, Column } from '@/components/ui/data-table';
import { SlideForm } from '@/components/ui/slide-form';
import { useExchangeRates } from '@/features/exchange-rates/hooks/use-exchange-rates';
import { ExchangeRate, CreateExchangeRateRequest } from '@/features/exchange-rates/models/exchange-rate.model';
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
  const { items, loading, loadItems } = useExchangeRates();
  const { t } = useI18n();
  const [formOpen, setFormOpen] = useState(false);
  const [latestRate, setLatestRate] = useState<ExchangeRate | null>(null);
  const [currencies, setCurrencies] = useState<{ id: number; code: string; name: string }[]>([]);
  const [formData, setFormData] = useState<CreateExchangeRateRequest>({
    rate: 0,
    type: 'official',
    source: 'BCV',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    exchangeRateService.getLatest().then(setLatestRate).catch(() => console.warn('Failed to load latest rate'));
    apiClient.get('/currencies').then((r) => setCurrencies(r.data.data || [])).catch(() => console.warn('Failed to load currencies'));
  }, []);

  const columns: Column<ExchangeRate>[] = [
    { field: 'id', headerName: t('exchangeRates.field.id') },
    {
      field: 'type',
      headerName: t('exchangeRates.field.type'),
      render: (row) => {
        const colors: Record<string, string> = { official: 'text-green-600', paralelo: 'text-amber-600', manual: 'text-blue-600' };
        return <span className={colors[row.type] ?? ''}>{row.type}</span>;
      },
    },
    {
      field: 'currencyId',
      headerName: t('exchangeRates.field.currency'),
      render: (row) => row.currency?.code ?? 'USD',
    },
    { field: 'rate', headerName: t('exchangeRates.field.rate') },
    {
      field: 'date',
      headerName: t('exchangeRates.field.date'),
      render: (row) => formatDate(row.date),
    },
    {
      field: 'source',
      headerName: t('exchangeRates.field.source'),
      render: (row) => row.source ?? '—',
    },
  ];

  const openCreate = () => {
    setError('');
    setFormData({ rate: 0, type: 'official', source: 'BCV' });
    setFormOpen(true);
  };

  const handleSave = async () => {
    setError('');
    setSubmitting(true);
    try {
      await exchangeRateService.create(formData);
      sileo.success({ description: t('exchangeRates.created') });
      await loadItems();
      setFormOpen(false);
    } catch {
      setError(t('exchangeRates.error.save'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SlideForm
      open={formOpen}
      title={t('exchangeRates.new')}
      onClose={() => setFormOpen(false)}
      panel={
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('exchangeRates.field.type')}</Label>
            <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="official">{t('exchangeRates.type.official')}</SelectItem>
                <SelectItem value="paralelo">{t('exchangeRates.type.paralelo')}</SelectItem>
                <SelectItem value="manual">{t('exchangeRates.type.manual')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('exchangeRates.field.currency')}</Label>
            <Select value={String(formData.currencyId ?? '')}
              onValueChange={(v) => setFormData({ ...formData, currencyId: Number(v) })}>
              <SelectTrigger><SelectValue placeholder={t('common.selectCurrency')} /></SelectTrigger>
              <SelectContent>
                {currencies.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.code} - {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('exchangeRates.field.rate')}</Label>
            <Input type="number" step="0.01" value={formData.rate}
              onChange={(e) => setFormData({ ...formData, rate: Number(e.target.value) })} required />
          </div>
          <div className="space-y-2">
            <Label>{t('exchangeRates.field.source')}</Label>
            <Select value={formData.source} onValueChange={(v) => setFormData({ ...formData, source: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="BCV">{t('exchangeRates.source.bcv')}</SelectItem>
                <SelectItem value="dolartoday">{t('exchangeRates.source.dolartoday')}</SelectItem>
                <SelectItem value="enparalelovzla">{t('exchangeRates.source.enparalelovzla')}</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSave} disabled={submitting} className="w-full">
            {submitting ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      }
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {latestRate && (
            <Badge variant="outline" className="text-sm py-1.5 px-3">
              BCV: <strong className="mx-1">{latestRate.rate}</strong> Bs./USD
              {latestRate.date && <span className="ml-2 text-muted-foreground">({formatDate(latestRate.date)})</span>}
            </Badge>
          )}
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
        rows={items}
        loading={loading}
        emptyMessage={t('exchangeRates.empty')}
      />
    </SlideForm>
  );
}
