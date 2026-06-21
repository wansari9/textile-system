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

  return (
    <Card
      header={
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-text-primary">{title}</h3>
          {data.length > 0 && (
            <button onClick={handleExport} className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-2.5 py-1.5 rounded-lg transition-colors">
              <Download size={14} />
              Export CSV
            </button>
          )}
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-text-muted uppercase tracking-wider">
              {columns.map((col, idx) => (
                <th key={idx} className="pb-2 pr-4 font-medium last:pr-0">{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-8 text-center text-sm text-text-muted">
                  No data available.
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-gray-50 transition-colors">
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className="py-2.5 pr-4 text-text-secondary last:pr-0">
                      {row[col.accessor]}
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
