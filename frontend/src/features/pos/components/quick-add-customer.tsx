'use client';

import { useState } from 'react';
import { Plus, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SlideForm } from '@/components/ui/slide-form';
import { useI18n } from '@/i18n';
import { localDb } from '@/lib/sync/db';
import { syncQueue } from '@/lib/sync/sync-queue';
import { sileo } from 'sileo';
import apiClient from '@/lib/api/api-client';

interface QuickAddCustomerProps {
  onCreated: (customer: { id: number; name: string; taxId: string; isWithholdingAgent: boolean; withholdingPercentage?: number | null; withholdingProof?: string }) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function QuickAddCustomer({ onCreated, open: externalOpen, onOpenChange }: QuickAddCustomerProps) {
  const { t } = useI18n();
  const [internalOpen, setInternalOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [phone, setPhone] = useState('');
  const [isWithholdingAgent, setIsWithholdingAgent] = useState(false);
  const [withholdingPercentage, setWithholdingPercentage] = useState(75);
  const [withholdingProof, setWithholdingProof] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isControlled = externalOpen !== undefined;
  const open = isControlled ? externalOpen : internalOpen;

  const setOpen = (v: boolean) => {
    if (isControlled) onOpenChange?.(v);
    else setInternalOpen(v);
  };

  const reset = () => {
    setFirstName(''); setLastName(''); setTaxId(''); setPhone('');
    setIsWithholdingAgent(false); setWithholdingPercentage(75); setWithholdingProof('');
    setError('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await apiClient.post('/uploads/proof', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setWithholdingProof(res.data.data.filename);
    } catch {
      setError('Se necesita conexión para subir el comprobante');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!firstName || !lastName || !taxId) {
      setError(t('pos.customer.error.save'));
      return;
    }
    setError('');
    setSaving(true);
    try {
      const id = Date.now();
      await localDb.customers.put({
        id,
        organizationId: 1,
        firstName, lastName, taxId, phone: phone || undefined,
        isWithholdingAgent,
        withholdingPercentage: isWithholdingAgent ? withholdingPercentage : undefined,
        withholdingProof: isWithholdingAgent ? withholdingProof || undefined : undefined,
        updatedAt: new Date().toISOString(),
      });
      await syncQueue.enqueue({
        operation: 'create',
        table: 'customers',
        data: {
          id, firstName, lastName, taxId, phone: phone || undefined,
          isWithholdingAgent,
          withholdingPercentage: isWithholdingAgent ? withholdingPercentage : undefined,
          withholdingProof: isWithholdingAgent ? withholdingProof || undefined : undefined,
        },
        localTimestamp: new Date().toISOString(),
      });
      sileo.success({ description: t('pos.customer.added') });
      onCreated({
        id, name: `${firstName} ${lastName}`, taxId,
        isWithholdingAgent,
        withholdingPercentage: isWithholdingAgent ? withholdingPercentage : null,
        withholdingProof: isWithholdingAgent ? withholdingProof || undefined : undefined,
      });
      reset();
      setOpen(false);
    } catch {
      setError(t('pos.customer.error.save'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SlideForm
        open={open}
        title={t('pos.customer.quickAddTitle')}
        onClose={() => setOpen(false)}
        panel={<div className="space-y-4">
            <div className="space-y-2"><Label>{t('pos.customer.field.firstName')}</Label><Input autoFocus value={firstName} onChange={(e) => setFirstName(e.target.value)} required /></div>
            <div className="space-y-2"><Label>{t('pos.customer.field.lastName')}</Label><Input value={lastName} onChange={(e) => setLastName(e.target.value)} required /></div>
            <div className="space-y-2"><Label>{t('pos.customer.field.taxId')}</Label><Input value={taxId} onChange={(e) => setTaxId(e.target.value)} required /></div>
            <div className="space-y-2"><Label>{t('pos.customer.field.phone')}</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <div className="flex items-center gap-2">
              <Switch id="quick-is-withholding-agent" checked={isWithholdingAgent} onCheckedChange={(c) => setIsWithholdingAgent(c)} />
              <Label htmlFor="quick-is-withholding-agent">{t('customers.field.isWithholdingAgent')}</Label>
            </div>
            {isWithholdingAgent && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>{t('customers.field.withholdingPercentage')}</Label>
                  <Select value={String(withholdingPercentage)} onValueChange={(v) => setWithholdingPercentage(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="75">75%</SelectItem>
                      <SelectItem value="100">100%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('customers.field.withholdingProof')}</Label>
                  {withholdingProof ? (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground truncate flex-1">{withholdingProof}</span>
                      <Button variant="ghost" size="icon" onClick={() => setWithholdingProof('')} aria-label={t('common.delete')}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" disabled={uploading} className="relative">
                        {uploading ? t('common.saving') : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            {t('customers.field.withholdingProof')}
                          </>
                        )}
                        <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? t('common.saving') : t('common.save')}
            </Button>
          </div>}
      >
        <Button size="sm" variant="ghost" onClick={() => { reset(); setOpen(true); }}>
          <Plus className="h-4 w-4" /> {t('pos.customer.quickAdd')}
        </Button>
      </SlideForm>
    </>
  );
}
