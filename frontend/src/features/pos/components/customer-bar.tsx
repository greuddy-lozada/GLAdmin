'use client';

import { forwardRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Search, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/i18n';
import { CustomerSearch } from './customer-search';

interface CustomerBarProps {
  customerId?: string;
  customerName?: string;
  customerTaxId?: string;
  withholdingPercentage: number | null;
  onSelectCustomer: (id?: string, name?: string, taxId?: string, withholding?: number | null) => void;
  onClearCustomer: () => void;
  onQuickAdd: () => void;
}

export const CustomerBar = forwardRef<HTMLInputElement, CustomerBarProps>(
  function CustomerBar({ customerId, customerName, customerTaxId, withholdingPercentage, onSelectCustomer, onClearCustomer, onQuickAdd }: CustomerBarProps, ref) {
    const { t } = useI18n();
    const hasCustomer = !!(customerId && customerName);

    return (
      <div className="relative min-h-[3.25rem]">
        <AnimatePresence mode="wait" initial={false}>
          {hasCustomer ? (
            <motion.div
              key="selected"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-2 px-4 py-2.5 border rounded-lg bg-primary/5 border-primary/20"
            >
              <User className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold truncate">{customerName}</span>
                  {customerTaxId && (
                    <span className="text-xs text-muted-foreground font-mono">{customerTaxId}</span>
                  )}
                  {withholdingPercentage != null && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-auto border-primary/40 text-primary">
                      {t('pos.withholding.agentBadge')} {withholdingPercentage}%
                    </Badge>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClearCustomer}>
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-2 px-4 py-2.5 border border-border/50 rounded-lg bg-card"
            >
              <Search className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <CustomerSearch
                  ref={ref}
                  value={undefined}
                  onChange={onSelectCustomer}
                />
              </div>
              <Button variant="ghost" size="sm" className="shrink-0" onClick={onQuickAdd}>
                {t('pos.customer.quickAdd')}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);
