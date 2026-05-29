'use client';

import { Input } from '@/components/ui/input';

interface Product {
  id: number;
  name: string;
  price: number;
  priceUsd?: number;
  stock: number;
}

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  return (
    <div className="space-y-4">
      <Input placeholder="Search products..." className="w-full" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map(product => (
          <button
            key={product.id}
            onClick={() => onAddToCart(product)}
            className="p-4 border rounded-lg hover:bg-accent transition-colors text-left"
          >
            <div className="font-medium">{product.name}</div>
            <div className="text-sm text-muted-foreground">
              ${product.price} | ${product.priceUsd || 0}
            </div>
            <div className="text-xs text-muted-foreground">
              Stock: {product.stock}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
