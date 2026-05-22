'use client';

import { ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Pencil, Trash2 } from 'lucide-react';

export interface Column<T> {
  field: keyof T | string;
  headerName: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  width?: number;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  emptyMessage?: string;
}

export function DataTable<T extends { id: number }>({
  columns,
  rows,
  loading,
  onEdit,
  onDelete,
  total,
  page = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  emptyMessage = 'No hay registros',
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={String(col.field)} style={{ width: col.width }}>
                {col.headerName}
              </TableHead>
            ))}
            {(onEdit || onDelete) && (
              <TableHead className="text-right">Acciones</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              {columns.map((col) => (
                <TableCell key={String(col.field)}>
                  {col.render
                    ? col.render(row)
                    : String(row[col.field as keyof T] ?? '')}
                </TableCell>
              ))}
              {(onEdit || onDelete) && (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {onEdit && (
                      <Button variant="ghost" size="icon" onClick={() => onEdit(row)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button variant="ghost" size="icon" onClick={() => onDelete(row)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {total !== undefined && onPageChange && (
        <div className="flex items-center justify-between border-t px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Filas por página:</span>
            <select
              className="border rounded px-2 py-1 bg-background"
              value={pageSize}
              onChange={(e) => onPageSizeChange?.(parseInt(e.target.value, 10))}
            >
              {[5, 10, 20, 50].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => onPageChange(page - 1)}
            >
              Anterior
            </Button>
            <span className="px-2">
              Página {page + 1} de {Math.max(1, Math.ceil((total || 0) / pageSize))}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= Math.ceil((total || 0) / pageSize) - 1}
              onClick={() => onPageChange(page + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
