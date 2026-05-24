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
import { Skeleton } from '@/components/ui/skeleton';
import { Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useI18n } from '@/i18n';

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

function SortIcon({ direction }: { direction: 'asc' | 'desc' | false }) {
  if (direction === 'asc') return <ArrowUp className="h-3 w-3" />;
  if (direction === 'desc') return <ArrowDown className="h-3 w-3" />;
  return <ArrowUpDown className="h-3 w-3 opacity-30" />;
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
  emptyMessage,
}: DataTableProps<T>) {
  const { t, tp } = useI18n();
  const [sorting, setSorting] = useState<SortingState>([]);

  const tableColumns = useMemo(
    () =>
      columns.map((col) => ({
        id: String(col.field),
        header: col.headerName,
        accessorFn: (row: T) => {
          const val = row[col.field as keyof T];
          return val != null ? String(val) : '';
        },
        cell: (info: { getValue: () => unknown; row: { original: T } }) =>
          col.render ? col.render(info.row.original) : String(info.getValue() ?? ''),
        enableSorting: col.sortable !== false,
        size: col.width,
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
            <Button variant="ghost" size="icon" onClick={() => onEdit(info.row.original)}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="icon" onClick={() => onDelete(info.row.original)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      ),
      enableSorting: false,
      size: undefined,
    });
  }

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
      <div className="rounded-md bg-white dark:bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={String(col.field)} style={{ width: col.width }}>
                  {col.headerName}
                </TableHead>
              ))}
              {(onEdit || onDelete) && <TableHead className="text-right">{t('common.actions')}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {columns.map((col) => (
                  <TableCell key={String(col.field)}>
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
    return (
      <div className="text-center py-12 text-muted-foreground">
        {emptyMessage || t('common.empty')}
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));

  return (
    <div className="rounded-md bg-white dark:bg-card">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  style={{ width: header.getSize() }}
                  className={
                    header.column.getCanSort()
                      ? 'cursor-pointer select-none'
                      : ''
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
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {total !== undefined && onPageChange && (
        <div className="flex items-center justify-between border-t px-3 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{t('common.rowsPerPage')}</span>
            <select
              className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              value={pageSize}
              onChange={(e) => onPageSizeChange?.(parseInt(e.target.value, 10))}
            >
              {[5, 10, 20, 50].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
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
