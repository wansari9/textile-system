import Card from './ui/Card';
import { Download } from 'lucide-react';

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
            <button onClick={handleExport} className="flex items-center gap-1.5 text-xs font-medium text-brand-dark bg-brand-light hover:bg-brand-light px-2.5 py-1.5 rounded-lg transition-colors font-sans">
              <Download size={14} />
              Export CSV
            </button>
          )}
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="sticky top-0 z-10 border-b border-linen text-left text-[11px] text-cool-gray uppercase tracking-[0.08em] font-sans bg-raw-cotton/50">
              {columns.map((col, idx) => (
                <th key={idx} scope="col" className="pb-3 pr-4 font-semibold last:pr-0">{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-linen">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-8 text-center text-sm text-cool-gray font-sans">
                  No data available.
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr key={rowIdx} className="border-l-2 border-transparent hover:border-brand transition-colors odd:bg-raw-cotton">
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`py-2.5 pr-4 last:pr-0 ${numericColumns[colIdx] ? 'text-right font-mono text-slate' : 'text-slate font-sans'}`}>
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
