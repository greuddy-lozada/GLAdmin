'use client';

import { ReactNode } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface SlideFormProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  loading?: boolean;
}

export function SlideForm({ open, title, onClose, children, loading }: SlideFormProps) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0">
        <SheetHeader className="flex flex-row items-center justify-between border-b px-6 py-4">
          <SheetTitle>{title}</SheetTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </SheetHeader>
        <div className="px-6 py-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            children
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
