import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

export interface Column<T> {
  header: string;
  accessor: (row: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  title?: string;
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  emptyText?: string;
}

export function DataTable<T>({
  title,
  columns,
  data,
  keyExtractor,
  emptyText = 'No records found.',
}: DataTableProps<T>) {
  return (
    <Card>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                {columns.map((col, idx) => (
                  <th key={idx} className={`p-4 ${col.className || ''}`}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="p-8 text-center text-xs text-slate-400">
                    {emptyText}
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={keyExtractor(row)} className="hover:bg-slate-50/50 transition-colors">
                    {columns.map((col, idx) => (
                      <td key={idx} className={`p-4 ${col.className || ''}`}>
                        {col.accessor(row)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
