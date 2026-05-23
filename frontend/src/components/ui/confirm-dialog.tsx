'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  loading,
}: ConfirmDialogProps) {
  const { t } = useI18n();
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            {cancelLabel || t('common.cancel')}
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? t('common.processing') : (confirmLabel || t('common.confirm'))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
