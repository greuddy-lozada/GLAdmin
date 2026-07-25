'use client';

import { useState } from 'react';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, BarChart3, Users, Package, ClipboardList, ArrowLeftRight } from 'lucide-react';
import { useReportTypes, useGenerateReport } from '../hooks/use-reports';
import type { ParamField } from '../models/report.model';

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  sales_summary: BarChart3,
  sales_by_customer: Users,
  sales_by_product: Package,
  inventory_status: ClipboardList,
  stock_movements: ArrowLeftRight,
};

interface ReportGeneratorProps {
  category: string;
  onGenerated: () => void;
}

function today(): string {
  return new Date().toISOString().substring(0, 10);
}

function firstOfMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function firstOfYear(): string {
  return `${new Date().getFullYear()}-01-01`;
}

function lastMonthRange(): { from: string; to: string } {
  const d = new Date();
  d.setDate(0);
  const lastDay = d.toISOString().substring(0, 10);
  d.setDate(1);
  const firstDay = d.toISOString().substring(0, 10);
  return { from: firstDay, to: lastDay };
}

const DATE_PRESETS = [
  { key: 'today', label: 'reports.presets.today', get: () => ({ from: today(), to: today() }) },
  { key: 'thisMonth', label: 'reports.presets.thisMonth', get: () => ({ from: firstOfMonth(), to: today() }) },
  { key: 'lastMonth', label: 'reports.presets.lastMonth', get: lastMonthRange },
  { key: 'thisYear', label: 'reports.presets.thisYear', get: () => ({ from: firstOfYear(), to: today() }) },
];

export function ReportGenerator({ category, onGenerated }: ReportGeneratorProps) {
  const { t } = useI18n();
  const { data: types } = useReportTypes();
  const generateMutation = useGenerateReport();

  const filteredTypes = (types ?? []).filter((rt) => rt.category === category);
  const [selectedType, setSelectedType] = useState<string>('');
  const [params, setParams] = useState<Record<string, string>>({});
  const [isExpanded, setIsExpanded] = useState(false);

  const selectedDefinition = filteredTypes.find((rt) => rt.type === selectedType);

  const handleSelectType = (type: string) => {
    const wasSelected = selectedType === type;
    if (wasSelected) {
      setSelectedType('');
      setIsExpanded(false);
    } else {
      setSelectedType(type);
      setParams({});
      setIsExpanded(true);
    }
  };

  const handleGenerate = async () => {
    if (!selectedType) return;
    try {
      const typedParams = convertParams(selectedDefinition?.parameters ?? []);
      await generateMutation.mutateAsync({ type: selectedType, parameters: typedParams });
      setSelectedType('');
      setParams({});
      setIsExpanded(false);
      onGenerated();
    } catch {
      // ponytail: error handled by the page via React Query
    }
  };

  const convertParams = (paramFields: ParamField[]): Record<string, unknown> => {
    const result: Record<string, unknown> = {};
    for (const f of paramFields) {
      const val = params[f.key];
      if (val === undefined || val === '') continue;
      if (f.type === 'number') result[f.key] = Number(val);
      else if (f.type === 'select' && f.options?.every((o) => o.value === 'true' || o.value === 'false'))
        result[f.key] = val === 'true';
      else result[f.key] = val;
    }
    return result;
  };

  const applyPreset = (key: string) => {
    const preset = DATE_PRESETS.find((p) => p.key === key);
    if (!preset) return;
    const { from, to } = preset.get();
    setParams((prev) => ({ ...prev, dateFrom: from, dateTo: to }));
  };

  const hasDateParams = selectedDefinition?.parameters.some((f) => f.type === 'date');

  return (
    <div className="p-4 border-b border-border">
      <h3 className="text-sm font-semibold mb-3">{t('reports.generate')}</h3>

      {/* Type Cards */}
      {filteredTypes.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">{t('reports.noTypesForCategory')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {filteredTypes.map((rt) => {
            const Icon = TYPE_ICONS[rt.type] || BarChart3;
            const active = selectedType === rt.type;
            return (
              <button
                key={rt.type}
                type="button"
                onClick={() => handleSelectType(rt.type)}
                className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                  active
                    ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border hover:bg-accent/30'
                }`}
              >
                <div className={`mt-0.5 p-1.5 rounded-md ${active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{t(rt.name)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t(rt.description)}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Expanded params + generate */}
      {isExpanded && selectedDefinition && (
        <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2">
          {/* Date params with presets */}
          {selectedDefinition.parameters.map((field) => {
            if (field.type === 'date') {
              return (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-xs font-semibold">{t(field.label)}</Label>
                  <Input
                    type="date"
                    value={params[field.key] || ''}
                    onChange={(e) => setParams({ ...params, [field.key]: e.target.value })}
                    className="h-9"
                  />
                </div>
              );
            }
            if (field.type === 'number') {
              return (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-xs font-semibold">{t(field.label)}</Label>
                  <Input
                    type="number"
                    value={params[field.key] ?? (field.defaultValue !== undefined ? String(field.defaultValue) : '')}
                    onChange={(e) => setParams({ ...params, [field.key]: e.target.value })}
                    className="h-9"
                  />
                </div>
              );
            }
            if (field.type === 'select' && field.options) {
              return (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-xs font-semibold">{t(field.label)}</Label>
                  <Select
                    value={params[field.key] || ''}
                    onValueChange={(v) => setParams({ ...params, [field.key]: v })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={t('reports.selectTypePlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {t(opt.label)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            }
            return null;
          })}

          {/* Date presets */}
          {hasDateParams && (
            <div className="flex flex-wrap gap-1.5">
              {DATE_PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => applyPreset(preset.key)}
                  className="px-2.5 py-1 text-xs rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors"
                >
                  {t(preset.label)}
                </button>
              ))}
            </div>
          )}

          {/* Generate button */}
          <Button
            onClick={handleGenerate}
            disabled={!selectedType || generateMutation.isPending}
            className="w-full"
            size="sm"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                {t('reports.generating')}...
              </>
            ) : (
              t('reports.generate')
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
