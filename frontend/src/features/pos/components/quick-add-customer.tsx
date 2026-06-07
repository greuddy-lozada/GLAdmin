'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SlideForm } from '@/components/ui/slide-form';
import { useI18n } from '@/i18n';
import { localDb } from '@/lib/sync/db';
import { syncQueue } from '@/lib/sync/sync-queue';
import { sileo } from 'sileo';

interface QuickAddCustomerProps {
  onCreated: (customer: { id: number; name: string; taxId: string }) => void;
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
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isControlled = externalOpen !== undefined;
  const open = isControlled ? externalOpen : internalOpen;

  const setOpen = (v: boolean) => {
    if (isControlled) onOpenChange?.(v);
    else setInternalOpen(v);
  };

  const reset = () => {
    setFirstName(''); setLastName(''); setTaxId(''); setPhone(''); setError('');
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
        updatedAt: new Date().toISOString(),
      });
      await syncQueue.enqueue({
        operation: 'create',
        table: 'customers',
        data: { id, firstName, lastName, taxId, phone: phone || undefined },
        localTimestamp: new Date().toISOString(),
      });
      sileo.success({ description: t('pos.customer.added') });
      onCreated({ id, name: `${firstName} ${lastName}`, taxId });
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
      <Button size="sm" variant="ghost" onClick={() => { reset(); setOpen(true); }}>
        <Plus className="h-4 w-4" /> {t('pos.customer.quickAdd')}
      </Button>
      <SlideForm
        open={open}
        title={t('pos.customer.quickAddTitle')}
        onClose={() => setOpen(false)}
        children={null}
        panel={
          <div className="space-y-4">
            <div className="space-y-2"><Label>{t('pos.customer.field.firstName')}</Label><Input autoFocus value={firstName} onChange={(e) => setFirstName(e.target.value)} required /></div>
            <div className="space-y-2"><Label>{t('pos.customer.field.lastName')}</Label><Input value={lastName} onChange={(e) => setLastName(e.target.value)} required /></div>
            <div className="space-y-2"><Label>{t('pos.customer.field.taxId')}</Label><Input value={taxId} onChange={(e) => setTaxId(e.target.value)} required /></div>
            <div className="space-y-2"><Label>{t('pos.customer.field.phone')}</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        }
      />
    </>
  );
}
