'use client';

import { ReactNode, useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  SortingState,
  flexRender,
  Row,
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
import { Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';

/** How a column appears in MobileCardList. Defaults inferred from column order. */
export type MobileColumnRole = 'title' | 'primary' | 'secondary' | 'hidden' | 'action';

export interface Column<T> {
  field: keyof T | string;
  headerName: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  width?: number;
  isNumeric?: boolean;
  /** @deprecated Prefer `mobile` — desktop-only table columns still show on mobile cards unless mobile:'hidden' */
  responsive?: 'always' | 'desktop';
  /** Mobile card role. Omit to auto: first=title, next 3=primary, rest=secondary. */
  mobile?: MobileColumnRole;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  emptyMessage?: string;
}

function SortIcon({ direction }: { direction: 'asc' | 'desc' | false }) {
  if (direction === 'asc') return <ArrowUp className="h-3 w-3" />;
  if (direction === 'desc') return <ArrowDown className="h-3 w-3" />;
  return <ArrowUpDown className="h-3 w-3 opacity-30" />;
}

function PaginationBar({
  page,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
  t,
  tp,
}: {
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  t: (key: string) => string;
  tp: (key: string, params: Record<string, string>) => string;
}) {
  if (!onPageChange) return null;
  return (
    <div className="border-t border-border/50 px-3 py-2.5">
      {/* Mobile: compact single row */}
      <div className="flex items-center justify-between gap-2 md:hidden">
        <Select
          value={String(pageSize)}
          onValueChange={(v) => onPageSizeChange?.(parseInt(v, 10))}
        >
          <SelectTrigger className="h-8 w-[4.25rem] text-xs" aria-label={t('common.rowsPerPage')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[5, 10, 20, 50].map((size) => (
              <SelectItem key={size} value={String(size)}>{String(size)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page === 0}
            onClick={() => onPageChange(page - 1)}
            aria-label={t('common.previous')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[3.5rem] text-center text-xs tabular-nums text-muted-foreground">
            {page + 1} / {Math.max(totalPages, 1)}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page >= totalPages - 1}
            onClick={() => onPageChange(page + 1)}
            aria-label={t('common.next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:flex md:items-center md:justify-between">
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
          <span className="px-2 text-sm text-muted-foreground tabular-nums">
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
    </div>
  );
}

function resolveMobileRoles<T>(columns: Column<T>[]): Array<Column<T> & { mobile: MobileColumnRole }> {
  const hasExplicit = columns.some((c) => c.mobile);
  if (hasExplicit) {
    return columns.map((c, i) => ({
      ...c,
      mobile: c.mobile ?? (i === 0 ? 'title' : 'secondary'),
    }));
  }
  return columns.map((c, i) => {
    if (i === 0) return { ...c, mobile: 'title' as const };
    if (i <= 3) return { ...c, mobile: 'primary' as const };
    return { ...c, mobile: 'secondary' as const };
  });
}

function cellValue<T>(col: Column<T>, original: T): ReactNode {
  if (col.render) return col.render(original);
  return String(original[col.field as keyof T] ?? '');
}

function MobileCardList<T extends { id: string | number }>({
  rows,
  columns,
  onEdit,
  onDelete,
  t,
}: {
  rows: Row<T>[];
  columns: Column<T>[];
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  t: (key: string) => string;
}) {
  const resolved = resolveMobileRoles(columns);
  const titleCol = resolved.find((c) => c.mobile === 'title') ?? resolved[0];
  const primary = resolved.filter((c) => c.mobile === 'primary');
  const secondary = resolved.filter((c) => c.mobile === 'secondary');
  const actionCols = resolved.filter((c) => c.mobile === 'action');

  return (
    <div className="md:hidden space-y-3 p-1">
      {rows.map((row) => {
        const original = row.original;
        const title = titleCol ? cellValue(titleCol, original) : '';

        return (
          <div
            key={row.id}
            className="rounded-xl border border-border/60 bg-card p-4 shadow-sm space-y-3"
          >
            <div className="text-base font-semibold leading-snug break-words">{title}</div>

            {primary.length > 0 && (
              <div className="space-y-1.5">
                {primary.map((col) => (
                  <div
                    key={String(col.field)}
                    className="flex items-start justify-between gap-3 text-sm"
                  >
                    <span className="text-xs text-muted-foreground shrink-0 pt-0.5">
                      {col.headerName}
                    </span>
                    <span
                      className={cn(
                        'text-right min-w-0 break-words',
                        col.isNumeric && 'tabular-nums font-medium',
                      )}
                    >
                      {cellValue(col, original)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {secondary.length > 0 && (
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
                  <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
                  {t('common.more')}
                </summary>
                <div className="mt-2 space-y-1.5 border-t border-border/40 pt-2">
                  {secondary.map((col) => (
                    <div
                      key={String(col.field)}
                      className="flex items-start justify-between gap-3 text-sm"
                    >
                      <span className="text-xs text-muted-foreground shrink-0 pt-0.5">
                        {col.headerName}
                      </span>
                      <span
                        className={cn(
                          'text-right min-w-0 break-words',
                          col.isNumeric && 'tabular-nums font-medium',
                        )}
                      >
                        {cellValue(col, original)}
                      </span>
                    </div>
                  ))}
                </div>
              </details>
            )}

            {(onEdit || onDelete || actionCols.length > 0) && (
              <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-border/50">
                {actionCols.map((col) => (
                  <div key={String(col.field)} className="contents">
                    {cellValue(col, original)}
                  </div>
                ))}
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(original)}
                    aria-label={t('common.edit')}
                  >
                    <Pencil className="h-4 w-4 mr-1.5" />
                    {t('common.edit')}
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(original)}
                    aria-label={t('common.delete')}
                  >
                    <Trash2 className="h-4 w-4 mr-1.5 text-destructive" />
                    {t('common.delete')}
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function DataTable<T extends { id: string | number }>({
  columns,
  rows,
  loading,
  onEdit,
  onDelete,
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

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: rows,
    columns: tableColumns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (loading) {
    return (
      <div className="rounded-md bg-card">
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col, i) => (
                  <TableHead key={String(col.field ?? col.headerName ?? i)} style={{ width: col.width }}>
                    {col.headerName}
                  </TableHead>
                ))}
                {(onEdit || onDelete) && <TableHead className="text-right">{t('common.actions')}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((col, j) => (
                    <TableCell key={String(col.field ?? col.headerName ?? j)}>
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
        <div className="md:hidden space-y-3 p-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/60 p-4 space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!rows.length) {
    return <EmptyState title={emptyMessage || t('common.empty')} />;
  }

  return (
    <div className="rounded-md bg-card flex flex-col overflow-hidden md:h-[calc(100dvh-14rem)]">
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="hidden md:block">
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
                        meta?.responsive === 'desktop' ? 'hidden lg:table-cell' : '',
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
                  const responsiveClass = meta?.responsive === 'desktop' ? 'hidden lg:table-cell' : '';
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
      </div>

      <MobileCardList
        rows={table.getRowModel().rows}
        columns={columns}
        onEdit={onEdit}
        onDelete={onDelete}
        t={t}
      />
      </div>

      <PaginationBar
        page={table.getState().pagination.pageIndex}
        pageSize={table.getState().pagination.pageSize}
        totalPages={table.getPageCount()}
        onPageChange={(p) => table.setPageIndex(p)}
        onPageSizeChange={(s) => table.setPageSize(s)}
        t={t}
        tp={tp}
      />
    </div>
  );
}
