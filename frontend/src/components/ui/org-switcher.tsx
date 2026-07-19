'use client';

import { useAuth } from '@/providers/auth-provider';
import { useI18n } from '@/i18n';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function OrgSwitcher() {
  const { organizations, currentOrg, selectOrg } = useAuth();
  const { t } = useI18n();

  if (!currentOrg) return null;

  const planLabel = currentOrg.plan?.label;

  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">
        {t('nav.org')}
      </p>
      <div className="flex items-center gap-2">
        <Select
          value={String(currentOrg.id)}
          onValueChange={(v) => selectOrg(v)}
        >
          <SelectTrigger className="h-8 text-sm font-medium border-border/50 focus:ring-0 [&>svg]:text-muted-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={String(org.id)}>
                <div className="flex items-center gap-2">
                  <span>{org.name}</span>
                  <span className="text-xs text-muted-foreground">({org.slug})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {planLabel && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
            {planLabel}
          </Badge>
        )}
      </div>
    </div>
  );
}
