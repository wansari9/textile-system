import Card from './ui/Card';
import { Download } from 'lucide-react';
import { button, table } from '../design';

interface Column {
  header: string;
  accessor: string;
}

interface ReportTableProps {
  title: string;
  columns: Column[];
  data: any[];
}

export default function ReportTable({ title, columns, data }: ReportTableProps) {
  const handleExport = () => {
    const headers = columns.map(c => c.header).join(',');
    const rows = data.map(row => columns.map(c => row[c.accessor] ?? '').join(','));
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

  const format = (val: any) => typeof val === 'number' ? val.toLocaleString() : val;

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
              {columns.map((col, idx) => (
                <th key={idx} scope="col" className={`${table.headCell} last:pr-0`}>{col.header}</th>
              ))}
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
                      {format(row[col.accessor])}
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
