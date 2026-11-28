import Card from './ui/Card';
import { ArrowDown, ArrowUp, ChevronsUpDown, Download } from 'lucide-react';
import { button, table } from '../design';

interface Column {
  header: string;
  accessor: string;
  /** Server whitelist key. A column is sortable only when this is set. */
  sortKey?: string;
  /** Display/CSV formatter; falls back to the raw value. */
  format?: (value: any, row: any) => string | number;
}

interface ReportTableProps {
  title: string;
  columns: Column[];
  data: any[];
  sort?: { key: string; dir: 'asc' | 'desc' } | null;
  onSort?: (sortKey: string) => void;
}

export default function ReportTable({ title, columns, data, sort, onSort }: ReportTableProps) {
  const valueOf = (row: any, col: Column) => {
    const raw = row[col.accessor];
    return col.format ? col.format(raw, row) : raw;
  };

  const handleExport = () => {
    const headers = columns.map(c => c.header).join(',');
    const rows = data.map(row => columns.map(c => valueOf(row, c) ?? '').join(','));
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const numericColumns = columns.map(col => {
    const sample = data.find(row => row[col.accessor] != null);
    return sample && typeof sample[col.accessor] === 'number';
  });

  const display = (row: any, col: Column, idx: number) => {
    const value = valueOf(row, col);
    if (value === null || value === undefined || value === '') return '—';
    return numericColumns[idx] && typeof value === 'number' ? value.toLocaleString() : value;
  };

  return (
    <Card
      header={
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-semibold text-ink font-sans">{title}</h3>
          {data.length > 0 && (
            <button
              onClick={handleExport}
              className={`${button.base} ${button.variants.outline} ${button.sizes.sm}`}
            >
              <Download size={14} />
              Export CSV
            </button>
          )}
        </div>
      }
    >
      <div className={table.wrapper}>
        <table className={table.base}>
          <thead>
            <tr className={`${table.head} sticky top-0 z-10 bg-raw-cotton/50`}>
              {columns.map((col, idx) => {
                const sortable = Boolean(col.sortKey && onSort);
                const active = Boolean(sort && col.sortKey && sort.key === col.sortKey);
                const Icon = !active ? ChevronsUpDown : sort?.dir === 'asc' ? ArrowUp : ArrowDown;
                return (
                  <th key={idx} scope="col" className={`${table.headCell} last:pr-0`}>
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => onSort?.(col.sortKey!)}
                        className={`inline-flex items-center gap-1 transition-colors hover:text-ink ${
                          active ? 'text-ink' : ''
                        }`}
                        aria-label={`Sort by ${col.header}`}
                      >
                        {col.header}
                        <Icon size={12} className={active ? 'text-ink' : 'text-muted'} />
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className={table.body}>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-8 text-center text-sm text-muted font-sans">
                  No data available.
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr key={rowIdx} className={`${table.row} border-l-2 border-transparent hover:border-ink`}>
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className={`${table.cell} last:pr-0 ${
                        numericColumns[colIdx] ? `${table.numeric} text-ink-soft` : 'text-ink-soft font-sans'
                      }`}
                    >
                      {display(row, col, colIdx)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
