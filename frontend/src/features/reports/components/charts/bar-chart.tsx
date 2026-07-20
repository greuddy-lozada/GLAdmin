'use client';

interface BarChartData {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarChartData[];
  valueFormatter?: (value: number) => string;
  className?: string;
}

export function BarChart({ data, valueFormatter, className }: BarChartProps) {
  const maxValue = data.length > 0 ? Math.max(...data.map((d) => d.value)) : 1;

  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-32 text-sm text-muted-foreground ${className ?? ''}`}>
        Sin datos
      </div>
    );
  }

  const formatValue = valueFormatter ?? ((v: number) => String(v));

  return (
    <div className={`flex items-end gap-3 h-32 ${className ?? ''}`}>
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
          <span className="text-xs font-medium">{formatValue(d.value)}</span>
          <div
            className="w-full rounded-t transition-all"
            style={{
              height: `${(d.value / maxValue) * 100}%`,
              minHeight: '4px',
              backgroundColor: 'var(--color-card-1, oklch(0.55 0.18 260))',
            }}
          />
          <span className="text-[10px] text-muted-foreground">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
