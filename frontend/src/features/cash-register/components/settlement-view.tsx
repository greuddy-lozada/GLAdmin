'use client';

import { useI18n } from '@/i18n';

interface SettlementViewProps {
  settlement: {
    expectedCash: number;
    countedCash: number;
    difference: number;
  };
  session: {
    initialCash: number;
    openedAt: string;
    closedAt?: string | null;
    cashRegister?: { name: string; code: string } | null;
  };
}

export default function SettlementView({ settlement, session }: SettlementViewProps) {
  const { t } = useI18n();
  const isSurplus = settlement.difference >= 0;

  return (
    <div className="space-y-3">
      <div className="text-center border-b pb-3">
        <p className="text-sm text-muted-foreground">{t('registerSession.cerrar')}</p>
        {session.cashRegister && (
          <p className="font-semibold">{session.cashRegister.name} ({session.cashRegister.code})</p>
        )}
      </div>
      <div className="space-y-1.5 text-sm">
        <Row label={t('registerSession.initialCash')} value={session.initialCash} />
        <Row label={t('registerSession.expectedCash')} value={settlement.expectedCash} />
        <Row label={t('registerSession.countedCash')} value={settlement.countedCash} />
        <div className={`border-t pt-1.5 font-semibold flex justify-between ${isSurplus ? 'text-green-600' : 'text-red-600'}`}>
          <span>{t('registerSession.difference')}</span>
          <span>{settlement.difference >= 0 ? '+' : ''}{settlement.difference.toFixed(2)}</span>
        </div>
        <p className="text-xs text-muted-foreground text-right">
          {isSurplus ? t('registerSession.sobrante') : t('registerSession.faltante')}
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>Bs. {value.toFixed(2)}</span>
    </div>
  );
}
