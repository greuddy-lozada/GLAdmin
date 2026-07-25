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
import { Loader2 } from 'lucide-react';
import { useReportTypes, useGenerateReport } from '../hooks/use-reports';
import type { ParamField } from '../models/report.model';

interface ReportGeneratorProps {
  onGenerated: () => void;
}

export function ReportGenerator({ onGenerated }: ReportGeneratorProps) {
  const { t } = useI18n();
  const { data: types } = useReportTypes();
  const generateMutation = useGenerateReport();

  const [selectedType, setSelectedType] = useState<string>('');
  const [params, setParams] = useState<Record<string, string>>({});

  const selectedDefinition = types?.find((rt) => rt.type === selectedType);

  const handleGenerate = async () => {
    if (!selectedType) return;
    try {
      const typedParams = convertParams(selectedDefinition?.parameters ?? []);
      await generateMutation.mutateAsync(
        { type: selectedType, parameters: typedParams },
      );
      onGenerated();
    } catch {
      // ponytail: error handled by the page via React Query
    }
    setSelectedType('');
    setParams({});
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

  const renderParamField = (field: ParamField) => {
    if (field.type === 'date') {
      return (
        <div key={field.key} className="space-y-2">
          <Label className="text-sm font-semibold">{t(field.label)}</Label>
          <Input
            type="date"
            value={params[field.key] || ''}
            onChange={(e) => setParams({ ...params, [field.key]: e.target.value })}
          />
        </div>
      );
    }

    if (field.type === 'number') {
      return (
        <div key={field.key} className="space-y-2">
          <Label className="text-sm font-semibold">{t(field.label)}</Label>
          <Input
            type="number"
            value={params[field.key] ?? (field.defaultValue !== undefined ? String(field.defaultValue) : '')}
            onChange={(e) => setParams({ ...params, [field.key]: e.target.value })}
          />
        </div>
      );
    }

    if (field.type === 'select' && field.options) {
      return (
        <div key={field.key} className="space-y-2">
          <Label className="text-sm font-semibold">{t(field.label)}</Label>
          <Select
            value={params[field.key] || ''}
            onValueChange={(v) => setParams({ ...params, [field.key]: v })}
          >
            <SelectTrigger>
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
  };

  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <h3 className="text-base font-semibold">{t('reports.generate')}</h3>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">{t('reports.selectType')}</Label>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger>
            <SelectValue placeholder={t('reports.selectTypePlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {types?.map((rt) => (
              <SelectItem key={rt.type} value={rt.type}>
                {t(rt.name)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedDefinition && selectedDefinition.parameters.length > 0 && (
        <div className="space-y-4">
          {selectedDefinition.parameters.map(renderParamField)}
        </div>
      )}

      <Button
        onClick={handleGenerate}
        disabled={!selectedType || generateMutation.isPending}
        className="w-full"
      >
        {generateMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {t('reports.generating')}...
          </>
        ) : (
          t('reports.generate')
        )}
      </Button>
    </div>
  );
}
