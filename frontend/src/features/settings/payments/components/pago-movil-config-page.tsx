'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useI18n } from '@/i18n';
import { usePagoMovilConfig } from '../hooks/use-pago-movil-config';
import { sileo } from 'sileo';

const VENEZUELA_BANKS = [
  { id: '0102', name: 'Banco de Venezuela' },
  { id: '0104', name: 'Banco Provincial' },
  { id: '0105', name: 'Mercantil' },
  { id: '0108', name: 'Banco Provincial' },
  { id: '0114', name: 'Bancaribe' },
  { id: '0115', name: 'Banco Exterior' },
  { id: '0116', name: 'Banco Occidental de Descuento' },
  { id: '0128', name: 'Banco Caroní' },
  { id: '0134', name: 'Banesco' },
  { id: '0137', name: 'Banco Sofitasa' },
  { id: '0138', name: 'Banco Plaza' },
  { id: '0146', name: 'Banco de la Gente' },
  { id: '0151', name: 'Banco Fondo Común' },
  { id: '0156', name: '100% Banco' },
  { id: '0157', name: 'Banco del Sur' },
  { id: '0163', name: 'Banco del Tesoro' },
  { id: '0166', name: 'Banco Agrícola de Venezuela' },
  { id: '0168', name: 'Bancrecer' },
  { id: '0171', name: 'Banco Activo' },
  { id: '0172', name: 'Bancamiga' },
  { id: '0173', name: 'Banco Internacional de Desarrollo' },
  { id: '0174', name: 'Banplus' },
  { id: '0175', name: 'Banco Bicentenario' },
  { id: '0176', name: 'Novo Banco' },
  { id: '0177', name: 'Banco de la Fuerza Armada Nacional' },
  { id: '0178', name: 'Banco Venezolano de Crédito' },
  { id: '0190', name: 'Banco Nacional de Crédito' },
  { id: '0191', name: 'Banco del Pueblo Soberano' },
];

export default function PagoMovilConfigPage() {
  const { t } = useI18n();
  const { config, loading, error, createConfig, updateConfig, loadConfig } = usePagoMovilConfig();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bankId, setBankId] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [exchangeRate, setExchangeRate] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (config) {
      setPhoneNumber(config.phoneNumber);
      setBankId(config.bankId);
      setIdNumber(config.idNumber);
      setExchangeRate(config.exchangeRate);
      setIsActive(config.isActive);
    }
  }, [config]);

  const handleSave = async () => {
    setFormError('');
    setSubmitting(true);
    try {
      if (config) {
        const ok = await updateConfig({ phoneNumber, bankId, idNumber, exchangeRate, isActive });
        if (ok) {
          sileo.success({ description: t('pagoMovil.config.updated') });
          await loadConfig();
        } else {
          setFormError(t('pagoMovil.config.error.save'));
        }
      } else {
        const ok = await createConfig({ phoneNumber, bankId, idNumber, exchangeRate });
        if (ok) {
          sileo.success({ description: t('pagoMovil.config.created') });
          await loadConfig();
        } else {
          setFormError(t('pagoMovil.config.error.save'));
        }
      }
    } catch {
      setFormError(t('pagoMovil.config.error.save'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {config === null && !loading && (
        <Alert>
          <AlertDescription>{t('pagoMovil.config.empty')}</AlertDescription>
        </Alert>
      )}

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      {formError && <Alert variant="destructive"><AlertDescription>{formError}</AlertDescription></Alert>}

      <Card>
        <CardHeader>
          <CardTitle>{t('pagoMovil.config.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label>{t('pagoMovil.config.field.phoneNumber')}</Label>
              <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="0412-1234567" />
            </div>

            <div className="space-y-2">
              <Label>{t('pagoMovil.config.field.bankId')}</Label>
              <Select value={bankId} onValueChange={setBankId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar banco" /></SelectTrigger>
                <SelectContent>
                  {VENEZUELA_BANKS.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('pagoMovil.config.field.idNumber')}</Label>
              <Input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="V-12345678" />
            </div>

            <div className="space-y-2">
              <Label>{t('pagoMovil.config.field.exchangeRate')}</Label>
              <Input type="number" step="0.01" value={exchangeRate} onChange={(e) => setExchangeRate(Number(e.target.value))} />
            </div>

            {config && (
              <div className="flex items-center gap-2">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <Label>{t('pagoMovil.config.field.isActive')}</Label>
              </div>
            )}

            <Button onClick={handleSave} disabled={submitting || loading}>
              {submitting ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
