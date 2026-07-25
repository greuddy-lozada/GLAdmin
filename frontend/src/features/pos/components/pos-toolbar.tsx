'use client';

import { Undo2, Pause, Timer, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/i18n';
import { useHotkey } from '@/hooks/use-hotkey';

interface PosToolbarProps {
  exchangeRate: number;
  onPark: () => void;
  onUndo: () => void;
  canUndo: boolean;
  hasItems: boolean;
  onOpenParked: () => void;
  onOpenHistory: () => void;
  parkedCount: number;
}

export function PosToolbar({ exchangeRate, onPark, onUndo, canUndo, hasItems, onOpenParked, onOpenHistory, parkedCount }: PosToolbarProps) {
  const { t } = useI18n();
  const { displayKeys: parkKeys } = useHotkey('pos.parkOrder', () => {}, { enabled: false });
  const { displayKeys: undoKeys } = useHotkey('pos.undo', () => {}, { enabled: false });

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-0.5">
        <Button variant="ghost" size="sm" onClick={onPark} disabled={!hasItems}>
          <Pause className="h-4 w-4" />
          <span className="hidden md:inline md:ml-2">{t('pos.park.button')}</span>
          <span className="hidden md:inline ml-1 text-xs text-muted-foreground">{parkKeys}</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={onUndo} disabled={!canUndo}>
          <Undo2 className="h-4 w-4" />
          <span className="hidden md:inline md:ml-2">{t('pos.toolbar.undo')}</span>
          <span className="hidden md:inline ml-1 text-xs text-muted-foreground">{undoKeys}</span>
        </Button>
        <div className="w-px h-5 bg-border mx-1" />
        <Button variant="ghost" size="sm" onClick={onOpenParked} className="relative">
          <Timer className="h-4 w-4" />
          {parkedCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 text-[10px] leading-none">
              {parkedCount}
            </Badge>
          )}
        </Button>
        <Button variant="ghost" size="sm" onClick={onOpenHistory}>
          <Receipt className="h-4 w-4" />
        </Button>
      </div>
      {exchangeRate > 0 && (
        <span className="text-xs text-muted-foreground">Tasa: {exchangeRate.toFixed(2)} Bs./USD</span>
      )}
    </div>
  );
}
