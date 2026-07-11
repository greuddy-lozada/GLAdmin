'use client';

import { Undo2, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import { useHotkey } from '@/hooks/use-hotkey';

interface PosToolbarProps {
  exchangeRate: number;
  onPark: () => void;
  onUndo: () => void;
  canUndo: boolean;
  hasItems: boolean;
}

export function PosToolbar({ exchangeRate, onPark, onUndo, canUndo, hasItems }: PosToolbarProps) {
  const { t } = useI18n();
  const { displayKeys: parkKeys } = useHotkey('pos.parkOrder', () => {}, { enabled: false });
  const { displayKeys: undoKeys } = useHotkey('pos.undo', () => {}, { enabled: false });

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onPark} disabled={!hasItems} title={`${t('pos.park.button')} (${parkKeys})`}>
          <Pause className="mr-2 h-4 w-4" />
          {t('pos.park.button')}
          <span className="ml-1 text-xs text-muted-foreground">{parkKeys}</span>
        </Button>
        <Button variant="outline" size="sm" onClick={onUndo} disabled={!canUndo} title={`${t('pos.toolbar.undo')} (${undoKeys})`}>
          <Undo2 className="mr-2 h-4 w-4" />
          {t('pos.toolbar.undo')}
          <span className="ml-1 text-xs text-muted-foreground">{undoKeys}</span>
        </Button>
      </div>
      {exchangeRate > 0 && (
        <span className="text-xs text-muted-foreground">Tasa: {exchangeRate.toFixed(2)} Bs./USD</span>
      )}
    </div>
  );
}
