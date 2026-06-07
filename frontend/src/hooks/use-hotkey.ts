'use client';

import { useEffect, useState, useRef } from 'react';
import { localDb } from '@/lib/sync/db';
import { defaultShortcuts, type ShortcutEntry } from '@/config/shortcuts';

interface UseHotkeyResult {
  keys: string;
  displayKeys: string;
}

interface UseHotkeyOptions {
  enabled?: boolean;
  preventDefault?: boolean;
}

function parseKeys(keys: string): { ctrl: boolean; shift: boolean; alt: boolean; meta: boolean; key: string } {
  const parts = keys.toLowerCase().split('+');
  return {
    ctrl: parts.includes('ctrl'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt'),
    meta: parts.includes('meta'),
    key: parts.filter(k => !['ctrl', 'shift', 'alt', 'meta'].includes(k)).join('+'),
  };
}

function matchEvent(e: KeyboardEvent, parsed: ReturnType<typeof parseKeys>): boolean {
  const key = e.key.toLowerCase();
  const targetKey = parsed.key;
  if (targetKey === 'escape') {
    return key === 'escape'
      && e.ctrlKey === parsed.ctrl
      && e.shiftKey === parsed.shift
      && e.altKey === parsed.alt
      && e.metaKey === parsed.meta;
  }
  return key === targetKey
    && e.ctrlKey === parsed.ctrl
    && e.shiftKey === parsed.shift
    && e.altKey === parsed.alt
    && e.metaKey === parsed.meta;
}

function isInputTarget(e: KeyboardEvent): boolean {
  const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || (e.target as HTMLElement)?.isContentEditable === true;
}

export function useHotkey(
  shortcutId: string,
  handler: (e: KeyboardEvent) => void,
  options: UseHotkeyOptions = {},
): UseHotkeyResult {
  const { enabled = true, preventDefault = true } = options;
  const [activeKeys, setActiveKeys] = useState<string | null>(null);
  const handlerRef = useRef(handler);

  useEffect(() => { handlerRef.current = handler; });

  const defaultEntry: ShortcutEntry | undefined = defaultShortcuts.find(s => s.id === shortcutId);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    localDb.shortcutBindings.where('shortcutId').equals(shortcutId).first().then(binding => {
      if (cancelled) return;
      setActiveKeys(binding?.keys ?? null);
    }).catch(console.warn);

    return () => { cancelled = true; };
  }, [shortcutId, enabled]);

  const keys = activeKeys ?? defaultEntry?.defaultKeys ?? '';
  const displayKeys = defaultEntry?.displayKeys ?? '';
  const parsed = parseKeys(keys);

  useEffect(() => {
    if (!enabled || !keys) return;

    const listener = (e: KeyboardEvent) => {
      if (!matchEvent(e, parsed)) return;
      if (e.key !== 'Escape' && isInputTarget(e)) return;
      if (preventDefault) e.preventDefault();
      handlerRef.current(e);
    };

    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys, enabled, preventDefault, parsed.key, parsed.ctrl, parsed.shift, parsed.alt, parsed.meta]);

  return { keys, displayKeys };
}
