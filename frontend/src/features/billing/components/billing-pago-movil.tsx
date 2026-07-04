'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, X, Eye, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SlideForm } from '@/components/ui/slide-form';
import { useI18n } from '@/i18n';
import { useSubscriptionPayment } from '../hooks/use-subscription-payment';
import { uploadFile } from '@/lib/api/upload';
import type { Plan } from '../models/billing.model';

import { VENEZUELA_BANKS, getBankName } from '@/lib/venezuela-banks';

interface BillingPagoMovilProps {
  plan: Plan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BillingPagoMovil({ plan, open, onOpenChange }: BillingPagoMovilProps) {
  const { t } = useI18n();
  const { config, loadConfig, submitting, create } = useSubscriptionPayment();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [bankId, setBankId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [reference, setReference] = useState('');
  const [proofImage, setProofImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const amountUsd = plan.amount / 100;

  useEffect(() => {
    if (open) {
      loadConfig();
      setError('');
    }
  }, [open, loadConfig]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = await uploadFile(file);
      setProofImage(path);
    } catch {
      setError(t('subscription.payment.error.upload'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!reference.trim()) {
      setError(t('subscription.payment.error.referenceRequired'));
      return;
    }
    setError('');
    const ok = await create({
      planId: plan.id,
      method: 'pago_movil',
      bankId,
      phoneNumber,
      reference,
      proofImage: proofImage || undefined,
    });
    if (ok) onOpenChange(false);
  };

  return (
    <SlideForm
      open={open}
      title={t('subscription.payment.pagoMovilTitle')}
      onClose={() => onOpenChange(false)}
      panel={<div className="space-y-4">
          {config?.pagoMovil.phoneNumber && (
            <div className="bg-muted rounded-lg p-3 space-y-1 text-sm">
              <p className="font-medium">{t('subscription.payment.depositTo')}</p>
              <p><span className="text-muted-foreground">{t('subscription.payment.bank')}:</span> {config.pagoMovil.bankId ? `${getBankName(config.pagoMovil.bankId)} (${config.pagoMovil.bankId})` : t('common.none')}</p>
              <p><span className="text-muted-foreground">{t('subscription.payment.phone')}:</span> {config.pagoMovil.phoneNumber}</p>
              {config.pagoMovil.idNumber && <p><span className="text-muted-foreground">ID:</span> {config.pagoMovil.idNumber}</p>}
            </div>
          )}
          <div className="rounded-lg border p-3">
            <p className="text-lg font-bold">${amountUsd.toFixed(2)}</p>
          </div>
          <div className="space-y-2">
            <Label>{t('subscription.payment.yourBank')}</Label>
            <Select value={bankId} onValueChange={setBankId}>
              <SelectTrigger><SelectValue placeholder={t('subscription.payment.selectBank')} /></SelectTrigger>
              <SelectContent>
                {VENEZUELA_BANKS.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('subscription.payment.yourPhone')}</Label>
            <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="04141234567" />
          </div>
          <div className="space-y-2">
            <Label>{t('subscription.payment.reference')} *</Label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} required placeholder="Nro. de referencia" />
          </div>
          <div className="space-y-2">
            <Label>{t('subscription.payment.proofImage')}</Label>
            {proofImage ? (
              <div className="flex items-center gap-2">
                <a href={proofImage} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate flex-1 inline-flex items-center gap-1">
                  <Eye className="h-4 w-4" /> {proofImage.split('/').pop()}
                </a>
                <Button type="button" variant="ghost" size="icon" onClick={() => setProofImage('')} aria-label={t('common.delete')}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={handleFileSelect} />
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? t('common.uploading') : t('common.selectFile')}
                </Button>
              </div>
            )}
          </div>
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            <Banknote className="mr-2 h-4 w-4" />
            {submitting ? t('common.saving') : t('subscription.payment.submit')}
          </Button>
        </div>
      }
    >
      <></>
    </SlideForm>
  );
}
