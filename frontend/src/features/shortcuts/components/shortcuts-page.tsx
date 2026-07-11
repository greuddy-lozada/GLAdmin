'use client';

import { useEffect, useState, useCallback } from 'react';
import { sileo } from 'sileo';
import { Keyboard, RotateCcw, Check } from 'lucide-react';
import { useI18n } from '@/i18n';
import { defaultShortcuts, type ShortcutEntry } from '@/config/shortcuts';
import { localDb } from '@/lib/sync/db';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const scopeOrder = ['pos', 'global'];

export default function ShortcutsPage() {
  const { t, tp } = useI18n();
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [listeningId, setListeningId] = useState<string | null>(null);

  const loadOverrides = useCallback(async () => {
    try {
      const all = await localDb.shortcutBindings.toArray();
      const map: Record<string, string> = {};
      for (const b of all) map[b.shortcutId] = b.keys;
      setOverrides(map);
    } catch (err) {
      console.warn('Error loading shortcuts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOverrides(); }, [loadOverrides]);

  const getKeys = (s: ShortcutEntry) => overrides[s.id] ?? s.defaultKeys;

  const handleListen = (shortcutId: string) => {
    setListeningId(shortcutId);
  };

  const handleKeyCapture = useCallback(async (e: KeyboardEvent) => {
    if (!listeningId) return;
    e.preventDefault();
    e.stopPropagation();

    const parts: string[] = [];
    if (e.ctrlKey) parts.push('ctrl');
    if (e.shiftKey) parts.push('shift');
    if (e.altKey) parts.push('alt');
    if (e.metaKey) parts.push('meta');
    const key = e.key.toLowerCase();
    if (!['control', 'shift', 'alt', 'meta'].includes(key)) {
      parts.push(key === ' ' ? 'space' : key);
    }
    if (parts.length === 0) return;

    const newKeys = parts.join('+');

    // conflict check
    for (const s of defaultShortcuts) {
      if (s.id === listeningId) continue;
      const existing = overrides[s.id] ?? s.defaultKeys;
      if (existing === newKeys) {
        sileo.error({ description: tp('shortcuts.conflict', { keys: s.displayKeys, existing: t(s.label) }) });
        setListeningId(null);
        return;
      }
    }

    try {
      await localDb.shortcutBindings.put({
        shortcutId: listeningId,
        keys: newKeys,
        updatedAt: new Date().toISOString(),
      });
      setOverrides(prev => ({ ...prev, [listeningId]: newKeys }));
      sileo.success({ description: t('shortcuts.saved') });
    } catch (err) {
      console.warn('Error saving shortcut:', err);
      sileo.error({ description: t('shortcuts.error.save') });
    }
    setListeningId(null);
  }, [listeningId, overrides, t, tp]);

  useEffect(() => {
    if (!listeningId) return;
    window.addEventListener('keydown', handleKeyCapture);
    return () => window.removeEventListener('keydown', handleKeyCapture);
  }, [listeningId, handleKeyCapture]);

  const handleRestoreDefaults = async () => {
    try {
      await localDb.shortcutBindings.clear();
      setOverrides({});
      sileo.success({ description: t('shortcuts.restored') });
    } catch (err) {
      console.warn('Error restoring shortcuts:', err);
      sileo.error({ description: t('shortcuts.error.save') });
    }
  };

  const grouped = scopeOrder.map(scope => ({
    scope,
    items: defaultShortcuts.filter(s => s.scope === scope),
  }));

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            {t('shortcuts.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {grouped.map(group => (
            <div key={group.scope}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                {t(`shortcuts.scope.${group.scope}`)}
              </h3>
              <div className="divide-y">
                {group.items.map(s => {
                  const currentKeys = getKeys(s);
                  const isOverridden = overrides[s.id] !== undefined;
                  const isListening = listeningId === s.id;
                  return (
                    <div key={s.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium">{t(s.label)}</p>
                        {isOverridden && (
                          <p className="text-xs text-muted-foreground">
                            {t('shortcuts.default')}: {s.displayKeys}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isListening ? (
                          <Button variant="secondary" size="sm" className="min-w-[120px] gap-2">
                            {t('shortcuts.listening')}
                          </Button>
                        ) : (
                          <kbd className="px-2 py-1 text-xs font-mono border rounded bg-muted">
                            {overrides[s.id] ? formatDisplay(currentKeys) : s.displayKeys}
                          </kbd>
                        )}
                        <Button
                          variant={isListening ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => isListening ? setListeningId(null) : handleListen(s.id)}
                          className="min-w-[80px]"
                        >
                          {isListening ? (
                            <><Check className="mr-1 h-3 w-3" />{t('common.cancel')}</>
                          ) : (
                            t('shortcuts.change')
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="pt-4 border-t">
            <Button variant="outline" size="sm" onClick={handleRestoreDefaults} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              {t('shortcuts.restoreDefaults')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formatDisplay(keys: string): string {
  return keys
    .split('+')
    .map(k => {
      if (k === 'ctrl') return 'Ctrl';
      if (k === 'shift') return 'Shift';
      if (k === 'alt') return 'Alt';
      if (k === 'meta') return '⌘';
      if (k === 'escape') return 'Esc';
      if (k === 'space') return 'Space';
      return k.charAt(0).toUpperCase() + k.slice(1);
    })
    .join('+');
}
