'use client';

import { useState, useRef } from 'react';
import { Plus, Upload, X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable, Column } from '@/components/ui/data-table';
import { SlideForm } from '@/components/ui/slide-form';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { RoleGuard } from '@/components/ui/role-guard';
import { useI18n } from '@/i18n';
import { usePagoMovilTransactions } from '../hooks/use-pago-movil-transactions';
import { PagoMovilTransaction, CreatePagoMovilTransactionRequest } from '../models/pago-movil-transaction.model';
import { sileo } from 'sileo';
import { uploadFile } from '@/lib/api/upload';

import { VENEZUELA_BANKS, getBankName } from '@/lib/venezuela-banks';

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString();
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };
  return (
    <Badge variant="outline" className={colors[status] ?? ''}>
      {status}
    </Badge>
  );
}

export default function PagoMovilTransactionsPage() {
  const { items, isLoading: loading, create, review } = usePagoMovilTransactions();
  const { t, tp } = useI18n();
  const [formOpen, setFormOpen] = useState(false);
  const [reviewDialog, setReviewDialog] = useState<{ open: boolean; id: number; action: 'approved' | 'rejected' }>({ open: false, id: 0, action: 'approved' });
  const [formData, setFormData] = useState<CreatePagoMovilTransactionRequest>({
    amountVes: 0,
    amountUsd: 0,
    bankId: '',
    phoneNumber: '',
    reference: '',
  });
  const [formError, setFormError] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const columns: Column<PagoMovilTransaction>[] = [
    { field: 'id', headerName: t('common.field.id') },
    { field: 'amountVes', headerName: t('pagoMovil.transactions.field.amountVes') },
    { field: 'amountUsd', headerName: t('pagoMovil.transactions.field.amountUsd') },
    {
      field: 'bankId',
      headerName: t('pagoMovil.transactions.field.bank'),
      render: (row) => getBankName(row.bankId),
    },
    { field: 'phoneNumber', headerName: t('pagoMovil.transactions.field.phoneNumber') },
    { field: 'reference', headerName: t('pagoMovil.transactions.field.reference') },
    {
      field: 'proofImage',
      headerName: t('pagoMovil.transactions.field.proofImage'),
      render: (row) =>
        row.proofImage ? (
          <a href={row.proofImage} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {t('common.view')}
          </a>
        ) : (
          <span className="text-muted-foreground text-sm">{t('common.none')}</span>
        ),
    },
    {
      field: 'status',
      headerName: t('pagoMovil.transactions.field.status'),
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      field: 'createdAt',
      headerName: t('pagoMovil.transactions.field.createdAt'),
      render: (row) => formatDate(row.createdAt),
    },
  ];

  const openCreate = () => {
    setFormError('');
    setFormData({ amountVes: 0, amountUsd: 0, bankId: '', phoneNumber: '', reference: '' });
    setFormOpen(true);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingProof(true);
    try {
      const path = await uploadFile(file);
      setFormData((prev) => ({ ...prev, proofImage: path }));
    } catch {
      setFormError(t('pagoMovil.transactions.error.upload'));
    } finally {
      setUploadingProof(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveProof = () => {
    setFormData((prev) => {
      const rest = { ...prev };
      delete rest.proofImage;
      return rest;
    });
  };

  const handleSave = () => {
    setFormError('');
    setFormOpen(false);
    create.mutate(formData, {
      onSuccess: () => sileo.success({ description: t('pagoMovil.transactions.submitted') }),
      onError: () => { setFormError(t('pagoMovil.transactions.error.save')); setFormOpen(true); },
    });
  };

  const handleReview = () => {
    setReviewDialog((prev) => ({ ...prev, open: false }));
    review.mutate(
      { id: reviewDialog.id, data: { status: reviewDialog.action } },
      {
        onSuccess: () => {
          const key = reviewDialog.action === 'approved' ? 'pagoMovil.review.approved' : 'pagoMovil.review.rejected';
          sileo.success({ description: t(key) });
        },
        onError: () => { setFormError(t('pagoMovil.review.error')); },
      },
    );
  };

  return (
    <>
      <SlideForm
        open={formOpen}
        title={t('pagoMovil.transactions.new')}
        onClose={() => setFormOpen(false)}
        panel={
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('pagoMovil.transactions.field.amountVes')}</Label>
              <Input type="number" step="0.01" value={formData.amountVes}
                onChange={(e) => setFormData({ ...formData, amountVes: Number(e.target.value) })} required />
            </div>
            <div className="space-y-2">
              <Label>{t('pagoMovil.transactions.field.amountUsd')}</Label>
              <Input type="number" step="0.01" value={formData.amountUsd}
                onChange={(e) => setFormData({ ...formData, amountUsd: Number(e.target.value) })} required />
            </div>
            <div className="space-y-2">
              <Label>{t('pagoMovil.transactions.field.bank')}</Label>
              <Select value={formData.bankId} onValueChange={(v) => setFormData({ ...formData, bankId: v })}>
                <SelectTrigger><SelectValue placeholder={t('pagoMovil.selectBank')} /></SelectTrigger>
                <SelectContent>
                  {VENEZUELA_BANKS.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('pagoMovil.transactions.field.phoneNumber')}</Label>
              <Input value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>{t('pagoMovil.transactions.field.reference')}</Label>
              <Input value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>{t('pagoMovil.transactions.field.proofImage')}</Label>
              {formData.proofImage ? (
                <div className="flex items-center gap-2">
                  <a href={formData.proofImage} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate flex-1">
                    {formData.proofImage.split('/').pop()}
                  </a>
                  <Button type="button" variant="ghost" size="icon" onClick={handleRemoveProof} title={t('common.delete')} aria-label={t('common.delete')}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={handleFileSelect} />
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadingProof}>
                    <Upload className="mr-2 h-4 w-4" />
                    {uploadingProof ? t('common.uploading') : t('common.selectFile')}
                  </Button>
                </div>
              )}
            </div>
            {formError && <Alert variant="destructive"><AlertDescription>{formError}</AlertDescription></Alert>}
            <Button onClick={handleSave} disabled={create.isPending} className="w-full">
              {create.isPending ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        }
      >
        <div className="flex items-center justify-between mb-6">
          <div />
          <RoleGuard minLevel={40}>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t('pagoMovil.transactions.new')}
            </Button>
          </RoleGuard>
        </div>

        <DataTable
          columns={columns}
          rows={items}
          loading={loading}
          emptyMessage={t('pagoMovil.transactions.empty')}
        />
      </SlideForm>

      <RoleGuard minLevel={60}>
        <div className="flex flex-wrap gap-4 mt-4">
          {items.filter((i) => i.status === 'pending').map((tx) => (
            <div key={tx.id} className="flex gap-2 items-center text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
              <span className="font-medium">#{tx.id}</span>
              <span className="text-xs text-muted-foreground">{getBankName(tx.bankId)}</span>
              {tx.proofImage && (
                <a href={tx.proofImage} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 text-xs">
                  <Eye className="h-3 w-3" />
                  {t('common.view')}
                </a>
              )}
              <Button size="sm" variant="outline" className="text-green-600 h-7 text-xs"
                onClick={() => setReviewDialog({ open: true, id: tx.id, action: 'approved' })}>
                {t('pagoMovil.review.approved')}
              </Button>
              <Button size="sm" variant="outline" className="text-red-600 h-7 text-xs"
                onClick={() => setReviewDialog({ open: true, id: tx.id, action: 'rejected' })}>
                {t('pagoMovil.review.rejected')}
              </Button>
            </div>
          ))}
        </div>
      </RoleGuard>

      <ConfirmDialog
        open={reviewDialog.open}
        title={t('pagoMovil.review.title')}
        message={tp('pagoMovil.review.description', { action: t(`pagoMovil.transactions.status.${reviewDialog.action}`) })}
        confirmLabel={t(`pagoMovil.transactions.status.${reviewDialog.action}`)}
        onConfirm={handleReview}
        onCancel={() => setReviewDialog({ ...reviewDialog, open: false })}
        loading={review.isPending}
      />
    </>
  );
}
