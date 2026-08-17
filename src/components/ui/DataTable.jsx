import React from 'react';
import { EmptyState } from './EmptyState';
import { LoadingState } from './LoadingState';
import { cn } from '../../utils/cn';

/**
 * Enterprise Data Table Component
 * Sticky headers, clean layout, loading & empty states, responsive horizontal scroll.
 */
export function DataTable({
  columns = [],
  data = [],
  isLoading = false,
  emptyTitle = 'No data available',
  emptyMessage = 'No records match your current criteria.',
  onRowClick,
  className,
}) {
  if (isLoading) {
    return <LoadingState rows={5} />;
  }

  if (!data || data.length === 0) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />;
  }

  return (
    <div className={cn('w-full overflow-x-auto border border-border rounded-lg bg-surface', className)}>
      <table className="w-full text-left border-collapse text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-raised/70 text-text-muted uppercase text-[11px] font-semibold tracking-wider">
            {columns.map((col, idx) => (
              <th
                key={col.key || idx}
                className={cn('px-4 py-3 font-semibold', col.headerClassName)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {data.map((row, rowIndex) => (
            <tr
              key={row.id || rowIndex}
              onClick={() => onRowClick && onRowClick(row)}
              className={cn(
                'transition-colors hover:bg-surface-hover/80',
                onRowClick && 'cursor-pointer'
              )}
            >
              {columns.map((col, colIndex) => (
                <td key={col.key || colIndex} className={cn('px-4 py-3 text-text-primary', col.className)}>
                  {col.cell ? col.cell(row) : row[col.accessorKey]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
