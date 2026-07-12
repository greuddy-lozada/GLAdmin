'use client';

import { ReactNode, useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  SortingState,
  flexRender,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';

export interface Column<T> {
  field: keyof T | string;
  headerName: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  width?: number;
  isNumeric?: boolean;
  responsive?: 'always' | 'desktop';
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

function SortIcon({ direction }: { direction: 'asc' | 'desc' | false }) {
  if (direction === 'asc') return <ArrowUp className="h-3 w-3" />;
  if (direction === 'desc') return <ArrowDown className="h-3 w-3" />;
  return <ArrowUpDown className="h-3 w-3 opacity-30" />;
}

export function DataTable<T extends { id: string | number }>({
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
  emptyMessage,
}: DataTableProps<T>) {
  const { t, tp } = useI18n();
  const [sorting, setSorting] = useState<SortingState>([]);

  const tableColumns = useMemo(
    () =>
      columns.map((col, i) => ({
        id: String(col.field ?? i),
        header: col.headerName,
        accessorFn: (row: T) => {
          const val = row[col.field as keyof T];
          return val != null ? String(val) : '';
        },
        cell: (info: { getValue: () => unknown; row: { original: T } }) =>
          col.render ? col.render(info.row.original) : String(info.getValue() ?? ''),
        enableSorting: col.sortable !== false,
        size: col.width,
        meta: { isNumeric: col.isNumeric, responsive: col.responsive ?? 'always' },
      })),
    [columns],
  );

  if (onEdit || onDelete) {
    tableColumns.push({
      id: 'actions',
      header: t('common.actions'),
      accessorFn: () => '',
      cell: (info: { row: { original: T } }) => (
        <div className="flex justify-end gap-1">
          {onEdit && (
            <Button variant="ghost" size="icon" onClick={() => onEdit(info.row.original)} aria-label={t('common.edit')}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="icon" onClick={() => onDelete(info.row.original)} aria-label={t('common.delete')}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      ),
      enableSorting: false,
      size: undefined,
      meta: { isNumeric: undefined, responsive: 'always' as const },
    });
  }

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: rows,
    columns: tableColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: Math.max(1, Math.ceil((total || 0) / pageSize)),
    initialState: { pagination: { pageIndex: page, pageSize } },
  });

  if (loading) {
    return (
      <div className="rounded-md bg-white dark:bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col, i) => (
                <TableHead key={String(col.field ?? col.headerName ?? i)} style={{ width: col.width }} className={col.responsive === 'desktop' ? 'hidden md:table-cell' : ''}>
                  {col.headerName}
                </TableHead>
              ))}
              {(onEdit || onDelete) && <TableHead className="text-right">{t('common.actions')}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {columns.map((col, i) => (
                  <TableCell key={String(col.field ?? col.headerName ?? i)} className={col.responsive === 'desktop' ? 'hidden md:table-cell' : ''}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                ))}
                {(onEdit || onDelete) && (
                  <TableCell>
                    <Skeleton className="h-5 w-12 ml-auto" />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (!rows.length) {
    return <EmptyState title={emptyMessage || t('common.empty')} />;
  }

  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));

  return (
    <div className="rounded-md bg-white dark:bg-card overflow-x-auto">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const meta = (header.column.columnDef.meta as { isNumeric?: boolean; responsive?: string } | undefined) || {};
                return (
                <TableHead
                  key={header.id}
                  style={{ width: header.getSize() }}
                  className={
                    cn(
                      header.column.getCanSort()
                        ? 'cursor-pointer select-none'
                        : '',
                      meta?.responsive === 'desktop' ? 'hidden md:table-cell' : '',
                    )
                  }
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center gap-1">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanSort() && (
                      <SortIcon direction={header.column.getIsSorted()} />
                    )}
                  </div>
                </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => {
                const meta = (cell.column.columnDef.meta as { isNumeric?: boolean; responsive?: string } | undefined);
                const isNumeric = meta?.isNumeric;
                const responsiveClass = meta?.responsive === 'desktop' ? 'hidden md:table-cell' : '';
                return (
                  <TableCell key={cell.id} className={cn(isNumeric ? 'text-right tabular-nums' : '', responsiveClass)}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {total !== undefined && onPageChange && (
        <div className="flex items-center justify-between border-t px-3 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{t('common.rowsPerPage')}</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => onPageSizeChange?.(parseInt(v, 10))}
            >
              <SelectTrigger className="h-9 w-[72px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50].map((size) => (
                  <SelectItem key={size} value={String(size)}>{String(size)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => onPageChange(page - 1)}
            >
              {t('common.previous')}
            </Button>
            <span className="px-2 text-sm text-muted-foreground">
              {tp('common.pageOf', { current: String(page + 1), total: String(totalPages) })}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => onPageChange(page + 1)}
            >
              {t('common.next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
