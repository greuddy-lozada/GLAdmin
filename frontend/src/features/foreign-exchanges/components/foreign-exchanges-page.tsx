'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useForeignExchanges } from '@/features/foreign-exchanges/hooks/use-foreign-exchanges';
import { ForeignExchange, CreateForeignExchangeRequest } from '@/features/foreign-exchanges/models/foreign-exchange.model';
import { foreignExchangeService } from '@/features/foreign-exchanges/services/foreign-exchange.service';
import { useI18n } from '@/i18n';
import apiClient from '@/lib/api/api-client';

export default function ForeignExchangesPage() {
  const { items, loading, loadItems } = useForeignExchanges();
  const { t } = useI18n();
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState<CreateForeignExchangeRequest>({
    idCurrency: 0,
    value: 0,
  });
  const [currencies, setCurrencies] = useState<{ id: number; code: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const columns: Column<ForeignExchange>[] = [
    { field: 'id', headerName: t('foreignExchanges.field.id') },
    {
      field: 'idCurrency',
      headerName: t('foreignExchanges.field.currency'),
      render: (row) => row.currency?.code ?? '',
    },
    { field: 'value', headerName: t('foreignExchanges.field.rate') },
  ];

  useEffect(() => {
    apiClient.get('/currencies').then((r) => setCurrencies(r.data.data || [])).catch(() => {});
  }, []);

  const openCreate = () => {
    setError('');
    setFormData({ idCurrency: 0, value: 0 });
    setFormOpen(true);
  };

  const handleSave = async () => {
    setError('');
    setSubmitting(true);
    try {
      await foreignExchangeService.create(formData);
      await loadItems();
      setFormOpen(false);
    } catch {
      setError(t('foreignExchanges.error.save'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SlideForm
      open={formOpen}
      title={t('foreignExchanges.new')}
      onClose={() => setFormOpen(false)}
      panel={
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('foreignExchanges.field.currency')}</Label>
            <Select value={String(formData.idCurrency)}
              onValueChange={(v) => setFormData({ ...formData, idCurrency: Number(v) })}>
              <SelectTrigger><SelectValue placeholder={t('common.selectCurrency')} /></SelectTrigger>
              <SelectContent>
                {currencies.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.code} - {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('foreignExchanges.field.rate')}</Label>
            <Input type="number" step="0.01" value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })} required />
          </div>
          <Button onClick={handleSave} disabled={submitting} className="w-full">
            {submitting ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      }
    >
      <div className="flex items-center justify-between mb-6">
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('foreignExchanges.new')}
        </Button>
      </div>

      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

      <DataTable
        columns={columns}
        rows={items}
        loading={loading}
        emptyMessage={t('foreignExchanges.empty')}
      />
    </SlideForm>
  );
}
