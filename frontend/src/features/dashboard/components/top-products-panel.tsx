import type { TopProduct } from '../models/dashboard-analytics.model';

interface Props {
  products: TopProduct[];
}

export function TopProductsPanel({ products }: Props) {
  const maxExistence = products.length > 0 ? Math.max(...products.map((p) => p.existence)) : 1;

  return (
    <div className="space-y-3">
      {products.map((p) => (
        <div key={p.id}>
          <div className="flex justify-between text-sm mb-1">
            <span className="truncate mr-2">{p.name}</span>
            <span className="font-medium shrink-0">{p.existence}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(p.existence / maxExistence) * 100}%`,
                backgroundColor: 'var(--color-card-1)',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
